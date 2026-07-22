/**
 * Compliance Management Routes
 * 
 * Handles CRUD operations for compliance frameworks, controls, and evidence.
 * Phase C: Enterprise Compliance Management
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermissionOr } from '../../middleware/rbac.js';
import { HttpError } from '../../common/httpError.js';
import { ComplianceManagementService } from '../../services/complianceManagement.service.js';
import { prisma } from '../../common/prisma.js';
import { env } from '../../config/env.js';
import { promises as fs } from 'fs';
import { generateExcel, formatDate } from '../../services/excelGenerator.service.js';

export const complianceManagementRouter = Router();

// ============================================================
// Framework Routes
// ============================================================

/**
 * GET /api/compliance-management/frameworks
 * List all frameworks with optional filters
 */
complianceManagementRouter.get('/frameworks', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);

    const result = await ComplianceManagementService.listFrameworks({
      search: search as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: pageNum,
      limit: limitNum
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance-management/frameworks/dropdown
 * Get frameworks for dropdown selection
 */
complianceManagementRouter.get('/frameworks/dropdown', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const frameworks = await ComplianceManagementService.getFrameworksDropdown();
    res.json({ items: frameworks });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance-management/frameworks/:id
 * Get single framework by ID
 */
complianceManagementRouter.get('/frameworks/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const framework = await ComplianceManagementService.getFramework(id);

    if (!framework) {
      throw new HttpError(404, 'Framework not found');
    }

    res.json(framework);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance-management/frameworks
 * Create a new framework
 */
complianceManagementRouter.post('/frameworks', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'Framework name is required');
    }

    const framework = await ComplianceManagementService.createFramework({
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: req.user?.id || null
    });

    res.status(201).json(framework);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/compliance-management/frameworks/:id
 * Update a framework
 */
complianceManagementRouter.patch('/frameworks/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const { name, description, status } = req.body;

    // Check if framework exists
    const existing = await ComplianceManagementService.getFramework(id);
    if (!existing) {
      throw new HttpError(404, 'Framework not found');
    }

    // Validate status if provided
    const validStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
    if (status && !validStatuses.includes(status)) {
      throw new HttpError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const framework = await ComplianceManagementService.updateFramework(id, {
      name: name?.trim(),
      description: description?.trim(),
      status
    });

    res.json(framework);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/compliance-management/frameworks/:id
 * Delete a framework
 */
complianceManagementRouter.delete('/frameworks/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:delete', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;

    // Check if framework exists
    const existing = await ComplianceManagementService.getFramework(id);
    if (!existing) {
      throw new HttpError(404, 'Framework not found');
    }

    await ComplianceManagementService.deleteFramework(id);

    res.json({ success: true, message: 'Framework deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Control Routes
// ============================================================

/**
 * GET /api/compliance-management/controls
 * List all controls with optional filters
 */
complianceManagementRouter.get('/controls', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const {
      frameworkId,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);

    const result = await ComplianceManagementService.listControls({
      frameworkId: frameworkId as string,
      search: search as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      page: pageNum,
      limit: limitNum
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance-management/controls/:id
 * Get single control by ID
 */
complianceManagementRouter.get('/controls/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const control = await ComplianceManagementService.getControl(id);

    if (!control) {
      throw new HttpError(404, 'Control not found');
    }

    res.json(control);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance-management/controls
 * Create a new control
 */
complianceManagementRouter.post('/controls', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { frameworkId, name, description } = req.body;

    if (!frameworkId || typeof frameworkId !== 'string') {
      throw new HttpError(400, 'Framework ID is required');
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'Control name is required');
    }

    const control = await ComplianceManagementService.createControl({
      frameworkId,
      name: name.trim(),
      description: description?.trim() || null,
      createdBy: req.user?.id || null
    });

    res.status(201).json(control);
  } catch (error: any) {
    if (error.message === 'Framework not found') {
      throw new HttpError(404, 'Framework not found');
    }
    next(error);
  }
});

/**
 * PATCH /api/compliance-management/controls/:id
 * Update a control
 */
complianceManagementRouter.patch('/controls/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;
    const { name, description, status } = req.body;

    // Check if control exists
    const existing = await ComplianceManagementService.getControl(id);
    if (!existing) {
      throw new HttpError(404, 'Control not found');
    }

    // Validate status if provided
    const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      throw new HttpError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const control = await ComplianceManagementService.updateControl(id, {
      name: name?.trim(),
      description: description?.trim(),
      status
    });

    res.json(control);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/compliance-management/controls/:id
 * Delete a control
 */
complianceManagementRouter.delete('/controls/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:delete', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;

    // Check if control exists
    const existing = await ComplianceManagementService.getControl(id);
    if (!existing) {
      throw new HttpError(404, 'Control not found');
    }

    await ComplianceManagementService.deleteControl(id);

    res.json({ success: true, message: 'Control deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Summary Route
// ============================================================

/**
 * GET /api/compliance-management/summary
 * Get compliance summary statistics
 */
complianceManagementRouter.get('/summary', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const summary = await ComplianceManagementService.getSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Evidence Routes
// ============================================================

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'compliance-evidence');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}
ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File validation
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
  '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.zip'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

/**
 * GET /api/compliance-management/evidence/:controlId
 * List evidence for a specific control
 */
complianceManagementRouter.get('/evidence/:controlId', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const controlId = req.params.controlId as string;

    // Verify control exists
    const control = await prisma.complianceControl.findUnique({
      where: { id: controlId }
    });

    if (!control) {
      throw new HttpError(404, 'Control not found');
    }

    const evidence = await prisma.complianceEvidence.findMany({
      where: { controlId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        mimeType: true,
        uploadedBy: true,
        uploadedAt: true
      }
    });

    res.json({ items: evidence });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/compliance-management/evidence/:controlId/upload
 * Upload evidence for a control
 */
complianceManagementRouter.post('/evidence/:controlId/upload', requireAuth, upload.single('file'), async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:create', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const controlId = req.params.controlId as string;

    // Verify control exists
    const control = await prisma.complianceControl.findUnique({
      where: { id: controlId }
    });

    if (!control) {
      throw new HttpError(404, 'Control not found');
    }

    if (!req.file) {
      throw new HttpError(400, 'No file uploaded');
    }

    const file = req.file;

    // Check for duplicate filenames in the same control
    const existingEvidence = await prisma.complianceEvidence.findFirst({
      where: {
        controlId,
        filePath: file.originalname
      }
    });

    if (existingEvidence) {
      // Delete the uploaded file
      await fs.unlink(file.path).catch(() => {});
      throw new HttpError(400, 'A file with this name already exists for this control');
    }

    const evidence = await prisma.complianceEvidence.create({
      data: {
        controlId,
        fileName: file.filename,
        filePath: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: req.user?.id || null
      }
    });

    res.status(201).json(evidence);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/compliance-management/evidence/:id/download
 * Download an evidence file
 */
complianceManagementRouter.get('/evidence/:id/download', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;

    const evidence = await prisma.complianceEvidence.findUnique({
      where: { id }
    });

    if (!evidence) {
      res.status(404).json({ message: 'Evidence not found' });
      return;
    }

    const filePath = path.join(uploadsDir, evidence.fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({ message: 'File not found on server' });
      return;
    }

    // Use sendFile for reliable file serving
    res.setHeader('Content-Type', evidence.mimeType);
    // Properly encode the filename for Content-Disposition
    const encodedFilename = encodeURIComponent(evidence.filePath).replace(/'/g, '%27');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error sending file' });
        }
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      next(error);
    }
  }
});

/**
 * DELETE /api/compliance-management/evidence/:id
 * Delete an evidence file
 */
complianceManagementRouter.delete('/evidence/:id', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:delete', 'compliance:write', 'compliance:manage'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const id = req.params.id as string;

    const evidence = await prisma.complianceEvidence.findUnique({
      where: { id }
    });

    if (!evidence) {
      res.status(404).json({ message: 'Evidence not found' });
      return;
    }

    // Delete file from disk
    const filePath = path.join(uploadsDir, evidence.fileName);
    try {
      await fs.unlink(filePath);
      console.log('Deleted file:', filePath);
    } catch (err) {
      console.log('File deletion error (continuing):', err);
      // File might not exist, continue with database deletion
    }

    // Delete from database
    await prisma.complianceEvidence.delete({
      where: { id }
    });
    console.log('Deleted evidence record:', id);

    res.json({ success: true, message: 'Evidence deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    next(error);
  }
});

// ============================================================
// Export Route
// ============================================================

/**
 * POST /api/compliance-management/export
 * Export selected controls to Excel
 */
complianceManagementRouter.post('/export', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage', 'compliance:export'])(req, res, (err) => err ? reject(err) : resolve())
    );

    const { controlIds, format = 'xlsx' } = req.body;

    if (!controlIds || !Array.isArray(controlIds) || controlIds.length === 0) {
      throw new HttpError(400, 'No controls selected for export');
    }

    // Fetch controls with their evidence
    const controls = await prisma.complianceControl.findMany({
      where: { id: { in: controlIds } },
      include: {
        framework: {
          select: { name: true }
        },
        evidence: {
          select: {
            filePath: true
          }
        }
      }
    });

    if (controls.length === 0) {
      throw new HttpError(404, 'No controls found');
    }

    // Prepare export data
    const rows = controls.map((control) => {
      const evidenceFileNames = control.evidence.map(e => e.filePath).join(', ');
      return {
        Framework: control.framework.name,
        Control: control.name,
        Description: control.description || '',
        Status: control.status,
        'Evidence Count': control.evidence.length,
        'Evidence File Names': evidenceFileNames || 'None',
        'Last Updated': formatDate(control.updatedAt)
      };
    });

    if (format === 'xlsx') {
      const buffer = generateExcel({
        headers: ['Framework', 'Control', 'Description', 'Status', 'Evidence Count', 'Evidence File Names', 'Last Updated'],
        rows,
        reportName: 'Compliance_Export'
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Compliance_Export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(buffer);
    } else {
      // Default to xlsx
      const buffer = generateExcel({
        headers: ['Framework', 'Control', 'Description', 'Status', 'Evidence Count', 'Evidence File Names', 'Last Updated'],
        rows,
        reportName: 'Compliance_Export'
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Compliance_Export_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.send(buffer);
    }
  } catch (error) {
    next(error);
  }
});
