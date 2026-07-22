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
import { ZipArchive } from 'archiver';

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
 * Export selected controls with evidence as a ZIP archive
 */
complianceManagementRouter.post('/export', requireAuth, async (req: Request, res: Response, next) => {
  try {
    await new Promise<void>((resolve, reject) =>
      requirePermissionOr(['compliance:read', 'compliance:view', 'compliance:manage', 'compliance:export'])(req, res, (err) => err ? reject(err) : resolve())
    );

    	
    const { controlIds } = req.body;

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
            id: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            uploadedBy: true,
            uploadedAt: true
          }
        }
      }
    });

    if (controls.length === 0) {
      throw new HttpError(404, 'No controls found');
    }

    // Generate timestamp for filename
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const zipFilename = `Compliance_Export_${timestamp}.zip`;

    // Set ZIP headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    // Create archive
    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on('error', (err: Error) => {
      throw err;
    });

    archive.pipe(res);

    // 1. Add Excel file with control information
    const excelRows = controls.map((control) => {
      const evidenceFileNames = control.evidence.map(e => e.filePath).join(', ');
      return {
        Framework: control.framework.name,
        'Control Name': control.name,
        Description: control.description || '',
        'Evidence File Names': evidenceFileNames || 'None',
        'Evidence Count': control.evidence.length,
        'Last Updated': formatDate(control.updatedAt)
      };
    });

    const excelBuffer = generateExcel({
      headers: ['Framework', 'Control Name', 'Description', 'Evidence File Names', 'Evidence Count', 'Last Updated'],
      rows: excelRows,
      reportName: 'Compliance_Controls'
    });

    archive.append(excelBuffer, { name: 'Compliance_Controls.xlsx' });

    // 2. Track missing files and add evidence documents
    const missingFiles: string[] = [];

    // Group evidence by framework and control for folder structure
    for (const control of controls) {
      const frameworkName = sanitizeFolderName(control.framework.name);
      const controlName = sanitizeFolderName(control.name);
      const folderPath = `Evidence Documents/${frameworkName}/${controlName}`;

      for (const evidence of control.evidence) {
        const evidenceFilePath = path.join(uploadsDir, evidence.fileName);
        
        try {
          await fs.access(evidenceFilePath);
          // Add file to archive with original filename preserved
          archive.file(evidenceFilePath, { 
            name: `${folderPath}/${evidence.filePath}` 
          });
        } catch {
          missingFiles.push(`${frameworkName}/${controlName}/${evidence.filePath}`);
          console.error(`File not found: ${evidenceFilePath}`);
        }
      }
    }

    // 3. Add README.txt if there are missing files
    const readmeContent = generateReadme(controls, missingFiles);
    archive.append(readmeContent, { name: 'README.txt' });

    // Finalize the archive
    archive.finalize();
  } catch (error) {
    next(error);
  }
});

// Helper function to sanitize folder names (remove invalid characters)
function sanitizeFolderName(name: string): string {
  // Replace characters that are invalid in folder names
  return name
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate README content
function generateReadme(controls: any[], missingFiles: string[]): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let readme = `# Compliance Export - ${dateStr}

## Contents

This ZIP archive contains compliance control data and evidence documents.

## Structure

- **Compliance_Controls.xlsx**
  Excel spreadsheet containing all exported control information including:
  - Framework name
  - Control name
  - Description
  - Evidence file names
  - Evidence count
  - Last updated date

- **Evidence Documents/**
  Contains all uploaded evidence files organized by framework and control:
`;

  // Add folder structure
  for (const control of controls) {
    const frameworkName = sanitizeFolderName(control.framework.name);
    const controlName = sanitizeFolderName(control.name);
    readme += `  ${frameworkName}/\n    ${controlName}/\n`;
    for (const evidence of control.evidence) {
      readme += `      - ${evidence.filePath}\n`;
    }
  }

  // Add missing files section if any
  if (missingFiles.length > 0) {
    readme += `
## ⚠️ Missing Files

The following evidence files could not be found and were not included:
`;
    for (const file of missingFiles) {
      readme += `- ${file}\n`;
    }
  }

  readme += `
## Export Summary

- Total Frameworks: ${new Set(controls.map(c => c.framework.name)).size}
- Total Controls: ${controls.length}
- Total Evidence Files: ${controls.reduce((sum, c) => sum + c.evidence.length, 0)}
- Missing Evidence Files: ${missingFiles.length}

---
Generated by Enterprise Compliance Management System
`;

  return readme;
}
