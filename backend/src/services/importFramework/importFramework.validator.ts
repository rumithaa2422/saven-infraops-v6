/**
 * Import Framework - Base Validator
 * 
 * Provides common validation functionality that module validators can extend.
 */

import {
  IImportValidator,
  ValidationResult,
  RowValidationResult,
  FieldError,
  ValidationContext,
  ColumnMapping,
  ImportInput
} from './importFramework.types.js';
import { 
  findColumn, 
  normalizeValue, 
  isEmptyRow 
} from './importFramework.parser.js';

/**
 * Result of template validation
 */
export interface TemplateValidationResult {
  valid: boolean;
  matchedColumns: string[];
  missingRequired: string[];
  message: string;
}

/**
 * Base validator class with common validation logic
 * Module validators can extend this class for convenience
 */
export abstract class BaseImportValidator implements IImportValidator {
  /**
   * Get column name variations for flexible matching
   */
  abstract getColumnMappings(): ColumnMapping;

  /**
   * Get required field names
   */
  abstract getRequiredFields(): string[];

  /**
   * Module-specific row validation (extend this in your validator)
   */
  protected abstract validateRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    context: ValidationContext,
    columnMap: Record<string, string | undefined>
  ): FieldError[];

  /**
   * Normalize row data (extend this in your validator)
   */
  protected abstract normalizeRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): ImportInput;
	
  /**
   * Get the entity name for messages (e.g., "user", "incident")
   */
  protected getEntityName(): string {
    return 'record';
  }

  /**
   * Get the module display name for error messages
   */
  protected abstract getModuleDisplayName(): string;

  /**
   * Validate that the uploaded file matches this module's expected template
   * Returns detailed validation result
   */
  validateTemplate(columns: string[]): TemplateValidationResult {
    const mappings = this.getColumnMappings();
    const requiredFields = this.getRequiredFields();
    const matchedColumns: string[] = [];
    const missingRequired: string[] = [];

    // Find which required fields have matching columns
    for (const field of requiredFields) {
      const variations = mappings[field] || [field];
      const lowerColumns = columns.map(c => c.toLowerCase().trim());
      
      let found = false;
      for (const variation of variations) {
        const index = lowerColumns.indexOf(variation.toLowerCase());
        if (index !== -1) {
          matchedColumns.push(columns[index]);
          found = true;
          break;
        }
      }
      
      if (!found) {
        missingRequired.push(field);
      }
    }

    const isValid = missingRequired.length === 0;
    const moduleName = this.getModuleDisplayName();

    let message: string;
    if (isValid) {
      message = `Template matches ${moduleName} import format.`;
    } else {
      message = `This file does not match the ${moduleName} import template. Missing required columns: ${missingRequired.join(', ')}`;
    }

    return {
      valid: isValid,
      matchedColumns,
      missingRequired,
      message
    };
  }

  /**
   * Validate required fields for a row
   */
  protected validateRequiredFields(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>,
    columns: string[]
  ): FieldError[] {
    const errors: FieldError[] = [];
    const requiredFields = this.getRequiredFields();

    for (const field of requiredFields) {
      const colName = columnMap[field];
      const value = colName ? normalizeValue(row[colName]) : '';
      
      if (!value) {
        errors.push({
          row: rowNumber,
          field: this.formatFieldName(field),
          message: `${this.formatFieldName(field)} is required`
        });
      }
    }

    return errors;
  }

  /**
   * Format field name for display (capitalize and replace underscores)
   */
  protected formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Validate a single row - framework entry point
   */
  validateRow(
    row: Record<string, unknown>,
    rowNumber: number,
    context: ValidationContext
  ): FieldError[] {
    const columns = Object.keys(row);
    const columnMap = findColumn(columns, this.getColumnMappings());
    const errors: FieldError[] = [];

    // First validate required fields
    errors.push(...this.validateRequiredFields(row, rowNumber, columnMap, columns));

    // Then validate module-specific rules
    errors.push(...this.validateRowData(row, rowNumber, context, columnMap));

    return errors;
  }

  /**
   * Normalize and transform a row - framework entry point
   */
  normalizeRow(row: Record<string, unknown>, rowNumber: number): ImportInput {
    const columns = Object.keys(row);
    const columnMap = findColumn(columns, this.getColumnMappings());
    return this.normalizeRowData(row, rowNumber, columnMap);
  }

  /**
   * Validate all rows and return validation result
   * This is the main validation method called by the framework
   */
  validateAll(
    data: Record<string, unknown>[],
    context: ValidationContext = {}
  ): ValidationResult {
    const rows: RowValidationResult[] = [];
    const errorsByRow: Record<number, string[]> = {};
    let validRows = 0;
    let invalidRows = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel-style row number (1-indexed, header is row 1)
      const columns = Object.keys(row);

      // Skip empty rows
      if (isEmptyRow(row, columns)) {
        rows.push({
          row: rowNumber,
          valid: true,
          data: row,
          errors: []
        });
        continue;
      }

      // Validate the row
      const errors = this.validateRow(row, rowNumber, context);
      const isValid = errors.length === 0;

      if (isValid) {
        validRows++;
      } else {
        invalidRows++;
        errorsByRow[rowNumber] = errors.map(e => e.message);
      }

      rows.push({
        row: rowNumber,
        valid: isValid,
        data: this.normalizeRowData(row, rowNumber, findColumn(columns, this.getColumnMappings())),
        errors
      });
    }

    const allValid = invalidRows === 0;
    const entityName = this.getEntityName();
    let message: string;

    if (allValid) {
      message = `All ${validRows} ${entityName}(s) are valid and ready for import.`;
    } else {
      message = `Found ${invalidRows} ${entityName}(s) with errors. Please fix them before importing.`;
    }

    return {
      success: allValid,
      totalRows: data.length,
      validRows,
      invalidRows,
      summary: {
        allValid,
        message
      },
      rows,
      errorsByRow
    };
  }
}

/**
 * Common validation utilities
 */
export class ValidationUtils {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return EMAIL_REGEX.test(email);
  }

  /**
   * Check if value exists in a set
   */
  static valueExists(value: string, existingSet: Set<string>): boolean {
    return existingSet.has(value.toLowerCase());
  }

  /**
   * Check if value is in allowed list
   */
  static isInAllowedList(value: string, allowedList: string[]): boolean {
    return allowedList.includes(value);
  }
}
