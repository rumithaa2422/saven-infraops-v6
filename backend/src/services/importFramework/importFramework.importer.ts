/**
 * Import Framework - Base Importer
 * 
 * Provides common import functionality that module importers can extend.
 */

import {
  IImportExecutor,
  ImportResult,
  ImportRecordResult,
  ImportInput,
  ValidationResult
} from './importFramework.types.js';

/**
 * Base importer class with common import logic
 * Module importers should extend this class
 */
export abstract class BaseImportExecutor implements IImportExecutor {
  /**
   * Import a single record - must be implemented by module
   */
  abstract importRecord(input: ImportInput): Promise<ImportRecordResult>;

  /**
   * Get the entity name for messages (e.g., "user", "incident")
   */
  protected getEntityName(): string {
    return 'record';
  }

  /**
   * Import all records from validated data
   * Continues on failure (best-effort import)
   */
  async importAll(
    data: ImportInput[],
    validationResult?: ValidationResult
  ): Promise<ImportResult> {
    const results: ImportRecordResult[] = [];
    let imported = 0;
    let failed = 0;
    let skipped = 0;

    for (const input of data) {
      try {
        const result = await this.importRecord(input);
        results.push(result);

        if (result.success) {
          imported++;
        } else {
          failed++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        results.push({
          row: input.importedRow || 0,
          success: false,
          identifier: String(input.email || input.name || 'unknown'),
          error: errorMessage
        });
        
        failed++;
      }
    }

    const allSuccessful = failed === 0;
    const entityName = this.getEntityName();
    let message: string;

    if (allSuccessful) {
      message = `Successfully imported ${imported} ${entityName}(s).`;
    } else {
      message = `Imported ${imported} ${entityName}(s), ${failed} failed.`;
    }

    return {
      success: allSuccessful,
      totalRows: data.length,
      imported,
      failed,
      skipped,
      results,
      summary: {
        allSuccessful,
        message
      }
    };
  }

  /**
   * Import records from validation result
   * Only imports valid rows
   */
  async importFromValidation(validationResult: ValidationResult): Promise<ImportResult> {
    const validRows = validationResult.rows
      .filter(r => r.valid)
      .map(r => r.data as ImportInput);

    return this.importAll(validRows, validationResult);
  }
}

/**
 * Helper to create import record result
 */
export function createImportRecordResult(
  success: boolean,
  input: ImportInput,
  options: {
    id?: string;
    error?: string;
    warning?: string;
  } = {}
): ImportRecordResult {
  return {
    row: input.importedRow || 0,
    success,
    identifier: String(input.email || input.name || input.id || 'unknown'),
    id: options.id,
    error: options.error,
    warning: options.warning
  };
}
