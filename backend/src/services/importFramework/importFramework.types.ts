/**
 * Import Framework - Shared Types
 * 
 * This file contains all shared interfaces and types used across the import framework.
 * Future modules should use these types when implementing their import functionality.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Parsed file metadata
 */
export interface ParsedFile {
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Parsed data from an Excel/CSV file
 */
export interface ParsedData {
  columns: string[];
  data: Record<string, unknown>[];
  totalRows: number;
  sheetName?: string;
}

/**
 * Upload response containing file metadata and parsed data
 */
export interface UploadResponse {
  success: boolean;
  file: ParsedFile;
  parsed: {
    totalRows: number;
    columns: string[];
    sheetName?: string;
    isPreview: boolean;
    data: Record<string, unknown>[];
  };
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error for a single field
 */
export interface FieldError {
  row: number;
  field: string;
  message: string;
}

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  row: number;
  valid: boolean;
  data: Record<string, unknown>;
  errors: FieldError[];
}

/**
 * Overall validation result
 */
export interface ValidationResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  summary: {
    allValid: boolean;
    message: string;
  };
  rows: RowValidationResult[];
  errorsByRow: Record<number, string[]>;
}

/**
 * Column mapping for flexible column name matching
 * Maps a logical field name to possible column name variations
 */
export interface ColumnMapping {
  [fieldName: string]: string[];
}

// ============================================================================
// Import Types
// ============================================================================

/**
 * Input data for importing a single record
 */
export interface ImportInput {
  importedRow?: number;
  [key: string]: unknown;
}

/**
 * Result for a single imported record
 */
export interface ImportRecordResult {
  row: number;
  success: boolean;
  identifier: string;
  id?: string;
  error?: string;
  warning?: string;
  details?: {
    row?: number;
    field?: string;
    value?: string;
    reason?: string;
    employeeId?: string;
    email?: string;
    name?: string;
    department?: string;
    role?: string;
    dateJoined?: string;
    errorCode?: string;
    [key: string]: unknown;
  };
}

/**
 * Overall import result
 */
export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  skipped: number;
  results: ImportRecordResult[];
  summary: {
    allSuccessful: boolean;
    message: string;
  };
}

// ============================================================================
// Framework Interfaces
// ============================================================================

/**
 * Interface for module-specific validators
 * Each module must implement this to provide its own validation logic
 */
export interface IImportValidator {
  /**
   * Get the column mappings for this module
   * Maps logical field names to possible column name variations
   */
  getColumnMappings(): ColumnMapping;

  /**
   * Get the required field names
   */
  getRequiredFields(): string[];

  /**
   * Validate a single row
   * @param row - The raw row data
   * @param rowNumber - The row number in the file (1-indexed)
   * @param context - Additional context (e.g., existing database values)
   * @returns Array of field errors (empty if valid)
   */
  validateRow(
    row: Record<string, unknown>,
    rowNumber: number,
    context: ValidationContext
  ): FieldError[];

  /**
   * Normalize and transform validated row data
   * @param row - The raw row data
   * @param rowNumber - The row number in the file
   * @returns Normalized import input
   */
  normalizeRow(
    row: Record<string, unknown>,
    rowNumber: number
  ): ImportInput;

  /**
   * Validate all rows and return validation result
   * @param data - Array of row data
   * @param context - Validation context
   * @returns Complete validation result
   */
  validateAll(data: Record<string, unknown>[], context?: ValidationContext): ValidationResult;
}

/**
 * Context passed to validators containing database lookups and other shared data
 */
export interface ValidationContext {
  existingValues?: Record<string, Set<string>>;
}

/**
 * Interface for module-specific importers
 * Each module must implement this to provide its own import logic
 */
export interface IImportExecutor {
  /**
   * Import a single record
   * @param input - The normalized import input
   * @returns Import result for this record
   */
  importRecord(input: ImportInput): Promise<ImportRecordResult>;

  /**
   * Import all records
   * @param data - Array of import inputs
   * @param validationResult - Optional validation result for context
   * @returns Complete import result
   */
  importAll(data: ImportInput[], validationResult?: ValidationResult): Promise<ImportResult>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Standard error response
 */
export interface ImportError {
  error: string;
  details?: unknown;
}

/**
 * Module registration for the framework
 */
export interface ImportModuleConfig {
  name: string;
  validator: IImportValidator;
  executor: IImportExecutor;
}
