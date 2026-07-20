/**
 * Import Framework - Orchestrator
 * 
 * Central orchestrator that manages all import modules and coordinates
 * the upload, validate, and execute operations.
 */

import { Request, Response } from 'express';
import multer from 'multer';
import {
  IImportValidator,
  IImportExecutor,
  ValidationResult,
  ImportResult,
  ValidationContext,
  ParsedFile,
  UploadResponse
} from './importFramework.types.js';
import {
  parseFile,
  getPreviewData,
  isPreviewData,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  DEFAULT_PREVIEW_LIMIT
} from './importFramework.parser.js';
import { TemplateValidationResult } from './importFramework.validator.js';
import { env } from '../../config/env.js';

// ============================================================================
// Multer Configuration
// ============================================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.EXCEL_MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
      cb(null, true);
      return;
    }
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      cb(null, true);
      return;
    }
    cb(new Error('Only .csv and .xlsx files are allowed'));
  }
});

export const importUpload = upload.single('file');

// ============================================================================
// Module Registry
// ============================================================================

type ValidatorFactory = () => IImportValidator;
type ExecutorFactory = () => IImportExecutor;

const registeredModules: Map<string, {
  validatorFactory: ValidatorFactory;
  executorFactory: ExecutorFactory;
}> = new Map();

/**
 * Register a module with the import framework
 */
export function registerImportModule(
  moduleType: string,
  validatorFactory: ValidatorFactory,
  executorFactory: ExecutorFactory
): void {
  registeredModules.set(moduleType, { validatorFactory, executorFactory });
}

/**
 * Get a registered module's validator
 */
export function getModuleValidator(moduleType: string): IImportValidator | null {
  const module = registeredModules.get(moduleType);
  return module ? module.validatorFactory() : null;
}

/**
 * Get a registered module's executor
 */
export function getModuleExecutor(moduleType: string): IImportExecutor | null {
  const module = registeredModules.get(moduleType);
  return module ? module.executorFactory() : null;
}

/**
 * Check if a module is registered
 */
export function isModuleRegistered(moduleType: string): boolean {
  return registeredModules.has(moduleType);
}

/**
 * Get list of registered module types
 */
export function getRegisteredModules(): string[] {
  return Array.from(registeredModules.keys());
}

// ============================================================================
// Validation Context Builder
// ============================================================================

/**
 * Build validation context with common lookups
 * Modules can override this to add their own context
 */
export async function buildValidationContext(_moduleType: string): Promise<ValidationContext> {
  return {};
}

// ============================================================================
// Import Framework Class
// ============================================================================

export class ImportFramework {
  /**
   * Handle file upload and parsing
   */
  static async upload(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please select a .csv or .xlsx file.' });
      return;
    }

    try {
      const parsed = parseFile(req.file.buffer);
      const preview = isPreviewData(parsed.totalRows);
      const dataToReturn = preview 
        ? getPreviewData(parsed, DEFAULT_PREVIEW_LIMIT) 
        : parsed.data;

      const response: UploadResponse = {
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
          isPreview: preview,
          data: dataToReturn
        }
      };

      res.json(response);
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('Invalid or corrupted')) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message.includes('empty') || error.message.includes('No columns')) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Import upload error:', error);
      res.status(500).json({ error: 'Failed to parse the file. Please check the file format.' });
    }
  }

  /**
   * Validate import data
   */
  static async validate(req: Request, res: Response): Promise<void> {
    try {
      const { moduleType, data, columns } = req.body as {
        moduleType: string;
        data: Record<string, unknown>[];
        columns?: string[];
      };

      if (!moduleType) {
        res.status(400).json({ error: 'moduleType is required' });
        return;
      }

      if (!data || !Array.isArray(data)) {
        res.status(400).json({ error: 'data must be an array' });
        return;
      }

      if (data.length === 0) {
        res.status(400).json({ error: 'No data to validate' });
        return;
      }

      const validator = getModuleValidator(moduleType);
      if (!validator) {
        res.status(400).json({ error: `Import module '${moduleType}' is not registered.` });
        return;
      }

      // BUG 1 FIX: Validate the template BEFORE validating rows
      // Get columns from first row if not provided
      const fileColumns = columns || (data.length > 0 ? Object.keys(data[0]) : []);
      
      // Check if this is a BaseImportValidator with validateTemplate method
      if ('validateTemplate' in validator && typeof validator.validateTemplate === 'function') {
        const templateResult = (validator as any).validateTemplate(fileColumns);
        
        if (!templateResult.valid) {
          res.json({
            success: false,
            totalRows: data.length,
            validRows: 0,
            invalidRows: data.length,
            templateValidation: templateResult,
            summary: {
              allValid: false,
              message: templateResult.message
            },
            rows: [],
            errorsByRow: {}
          });
          return;
        }
      }

      // Build validation context
      const context = await buildValidationContext(moduleType);

      // Validate all rows
      const result = validator.validateAll(data, context);

      res.json(result);
    } catch (err) {
      const error = err as Error;
      console.error('Import validation error:', error);
      res.status(500).json({ error: 'Failed to validate the data. Please check the data format.' });
    }
  }

  /**
   * Execute import
   */
  static async execute(req: Request, res: Response): Promise<void> {
    try {
      const { moduleType, data, columns } = req.body as {
        moduleType: string;
        data: Record<string, unknown>[];
        columns?: string[];
      };

      if (!moduleType) {
        res.status(400).json({ error: 'moduleType is required' });
        return;
      }

      if (!data || !Array.isArray(data)) {
        res.status(400).json({ error: 'data must be an array' });
        return;
      }

      if (data.length === 0) {
        res.status(400).json({ error: 'No data to import' });
        return;
      }

      const validator = getModuleValidator(moduleType);
      const executor = getModuleExecutor(moduleType);

      if (!validator || !executor) {
        res.status(400).json({ error: `Import module '${moduleType}' is not registered.` });
        return;
      }

      // BUG 1 FIX: Validate the template BEFORE validating rows
      const fileColumns = columns || (data.length > 0 ? Object.keys(data[0]) : []);
      
      if ('validateTemplate' in validator && typeof validator.validateTemplate === 'function') {
        const templateResult = (validator as any).validateTemplate(fileColumns);
        
        if (!templateResult.valid) {
          res.status(400).json({
            error: templateResult.message,
            templateValidation: templateResult
          });
          return;
        }
      }

      // Validate all rows
      const context = await buildValidationContext(moduleType);
      const validationResult = validator.validateAll(data, context);

      // Check if all rows are valid
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Some rows have validation errors. Please fix them before importing.',
          validationResult
        });
        return;
      }

      // Get valid rows for import
      const validRows = validationResult.rows
        .filter(r => r.valid)
        .map((r, index) => ({
          ...r.data,
          importedRow: index + 2 // Excel row number
        }));

      // Execute import
      const importResult = await executor.importAll(validRows, validationResult);

      // Return detailed import result with all failure information
      res.json({
        success: importResult.success,
        totalRows: importResult.totalRows,
        imported: importResult.imported,
        failed: importResult.failed,
        skipped: importResult.skipped,
        summary: importResult.summary,
        results: importResult.results.map(r => ({
          row: r.row,
          success: r.success,
          identifier: r.identifier,
          id: r.id,
          error: r.error,
          warning: r.warning,
          details: r.details
        }))
      });
    } catch (err) {
      const error = err as Error;
      console.error('Import execute error:', error);
      res.status(500).json({ error: 'Failed to import. Please try again.' });
    }
  }

  /**
   * Get multer upload middleware
   */
  static getUploadMiddleware() {
    return importUpload;
  }
}

// ============================================================================
// Error Handler
// ============================================================================

export function importErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: Function
): void {
  if (err.message.includes('Only .csv and .xlsx files are allowed')) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err.message.includes('File too large')) {
    res.status(400).json({ error: `File too large. Maximum size is ${env.EXCEL_MAX_FILE_SIZE_MB}MB.` });
    return;
  }
  console.error('Import error:', err);
  res.status(500).json({ error: 'An error occurred while processing the file.' });
}
