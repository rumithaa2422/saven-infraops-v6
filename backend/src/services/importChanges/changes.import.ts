/**
 * Changes Import Module
 * Implements the import framework for Changes module.
 */

import {
  BaseImportValidator,
  ValidationUtils,
  BaseImportExecutor,
  createImportRecordResult,
  registerImportModule
} from '../importFramework/importFramework.index.js';
import {
  ImportInput,
  ImportRecordResult,
  ColumnMapping
} from '../importFramework/importFramework.types.js';
import { normalizeValue } from '../importFramework/importFramework.parser.js';
import { createChangeRequest } from '../change.service.js';

// Risk levels
const VALID_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ============================================================================
// Changes Validator
// ============================================================================

class ChangesImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      title: ['title', 'subject', 'summary', 'name', 'change title'],
      riskLevel: ['risk level', 'risk_level', 'risk', 'priority'],
      ownerName: ['owner', 'owner name', 'owner_name', 'assigned to', 'assignee', 'responsible'],
      rollbackPlan: ['rollback plan', 'rollback_plan', 'rollback', 'backout plan'],
      changeWindow: ['change window', 'change_window', 'window', 'scheduled date', 'schedule'],
      description: ['description', 'details', 'notes', 'body', 'change description']
    };
  }

  getRequiredFields(): string[] {
    return ['title'];
  }

  protected getEntityName(): string {
    return 'change';
  }

  protected validateRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    _context: import('../importFramework/importFramework.types.js').ValidationContext,
    columnMap: Record<string, string | undefined>
  ): import('../importFramework/importFramework.types.js').FieldError[] {
    const errors: import('../importFramework/importFramework.types.js').FieldError[] = [];

    const riskLevel = normalizeValue(columnMap['riskLevel'] ? row[columnMap['riskLevel']] : row['RiskLevel']);

    if (riskLevel && !ValidationUtils.isInAllowedList(riskLevel, VALID_RISK_LEVELS)) {
      errors.push({
        row: rowNumber,
        field: 'Risk Level',
        message: `Invalid risk level. Allowed: ${VALID_RISK_LEVELS.join(', ')}`
      });
    }

    return errors;
  }

  protected normalizeRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): ImportInput {
    const title = normalizeValue(columnMap['title'] ? row[columnMap['title']] : row['Title']);
    const riskLevel = normalizeValue(columnMap['riskLevel'] ? row[columnMap['riskLevel']] : row['RiskLevel']);
    const ownerName = normalizeValue(columnMap['ownerName'] ? row[columnMap['ownerName']] : row['OwnerName']);
    const rollbackPlan = normalizeValue(columnMap['rollbackPlan'] ? row[columnMap['rollbackPlan']] : row['RollbackPlan']);
    const changeWindow = normalizeValue(columnMap['changeWindow'] ? row[columnMap['changeWindow']] : row['ChangeWindow']);
    const description = normalizeValue(columnMap['description'] ? row[columnMap['description']] : row['Description']);

    return {
      title,
      riskLevel: riskLevel || 'MEDIUM',
      ownerName: ownerName || undefined,
      rollbackPlan: rollbackPlan || undefined,
      changeWindow: changeWindow || undefined,
      description: description || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Changes Executor
// ============================================================================

class ChangesImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'change';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const change = await createChangeRequest({
        title: input.title as string,
        riskLevel: input.riskLevel as string | undefined,
        ownerName: input.ownerName as string | null | undefined,
        rollbackPlan: input.rollbackPlan as string | null | undefined,
        changeWindow: input.changeWindow as Date | string | null | undefined,
        description: input.description as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: change.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const changesValidator = new ChangesImportValidator();
const changesExecutor = new ChangesImportExecutor();

export function registerChangesImport(): void {
  registerImportModule('change-requests', () => changesValidator, () => changesExecutor);
}

export { changesValidator, changesExecutor };
