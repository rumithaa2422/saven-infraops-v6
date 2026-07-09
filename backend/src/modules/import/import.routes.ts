import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission, requirePermissionOr } from '../../middleware/rbac.js';
import { registerUsersImport } from '../../services/importUsers/index.js';
import { registerIncidentsImport } from '../../services/importIncidents/index.js';
import { registerProblemsImport } from '../../services/importProblems/index.js';
import { registerChangesImport } from '../../services/importChanges/index.js';
import { registerInventoryImport } from '../../services/importInventory/index.js';
// NOTE: Compliance is now a document repository - no CSV import support
// import { registerComplianceImport } from '../../services/importCompliance/index.js';
import { registerProjectsImport } from '../../services/importProjects/index.js';
import { registerVendorsImport } from '../../services/importVendors/index.js';
import { registerKnowledgeBaseImport } from '../../services/importKnowledgeBase/index.js';
import {
  ImportFramework,
  importErrorHandler
} from '../../services/importFramework/importFramework.orchestrator.js';

export const importRouter = Router();

// Register all import modules
registerUsersImport();
registerIncidentsImport();
registerProblemsImport();
registerChangesImport();
registerInventoryImport();
// Compliance is now a document repository - PDF uploads only
// registerComplianceImport();
registerProjectsImport();
registerVendorsImport();
registerKnowledgeBaseImport();

/**
 * POST /api/import/upload
 * Upload and parse Excel/CSV file
 */
importRouter.post('/upload', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), ImportFramework.getUploadMiddleware(), ImportFramework.upload.bind(ImportFramework));

/**
 * POST /api/import/validate
 * Validate parsed import data
 */
importRouter.post('/validate', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), ImportFramework.validate.bind(ImportFramework));

/**
 * POST /api/import/execute
 * Execute the import
 */
importRouter.post('/execute', requireAuth, requirePermissionOr(['settings:write', 'settings:manage']), ImportFramework.execute.bind(ImportFramework));

/**
 * Legacy endpoint for backward compatibility
 * @deprecated Use /upload instead
 */
importRouter.post('/excel/preview', requireAuth, requirePermission('settings:write'), ImportFramework.getUploadMiddleware(), ImportFramework.upload.bind(ImportFramework));

// Error handling middleware for multer
importRouter.use(importErrorHandler);
