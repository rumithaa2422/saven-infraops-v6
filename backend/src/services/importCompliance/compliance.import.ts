/**
 * Compliance Import Module
 * Implements the import framework for Compliance module.
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
import { createComplianceControl } from '../compliance.service.js';

// Risk ratings
const VALID_RISK_RATINGS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Frequencies
const VALID_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];

// ============================================================================
// Compliance Validator
// ============================================================================

class ComplianceImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      title: ['title', 'subject', 'control title', 'control name'],
      controlArea: ['control area', 'control_area', 'area', 'domain', 'category', 'framework'],
      ownerName: ['owner', 'owner name', 'owner_name', 'responsible', 'control owner'],
      frequency: ['frequency', 'review frequency', 'assessment frequency'],
      riskRating: ['risk rating', 'risk_rating', 'risk', 'impact'],
      dueAt: ['due at', 'due_at', 'due date', 'due', 'deadline', 'review date'],
      evidenceUrl: ['evidence url', 'evidence_url', 'evidence', 'documentation url', 'proof']
    };
  }

  getRequiredFields(): string[] {
    return ['title', 'controlArea', 'ownerName'];
  }

  protected getEntityName(): string {
    return 'compliance control';
  }

  protected getModuleDisplayName(): string {
    return 'Compliance';
  }

  protected validateRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    _context: import('../importFramework/importFramework.types.js').ValidationContext,
    columnMap: Record<string, string | undefined>
  ): import('../importFramework/importFramework.types.js').FieldError[] {
    const errors: import('../importFramework/importFramework.types.js').FieldError[] = [];

    const riskRating = normalizeValue(columnMap['riskRating'] ? row[columnMap['riskRating']] : row['RiskRating']);
    const frequency = normalizeValue(columnMap['frequency'] ? row[columnMap['frequency']] : row['Frequency']);

    if (riskRating && !ValidationUtils.isInAllowedList(riskRating, VALID_RISK_RATINGS)) {
      errors.push({
        row: rowNumber,
        field: 'Risk Rating',
        message: `Invalid risk rating. Allowed: ${VALID_RISK_RATINGS.join(', ')}`
      });
    }

    if (frequency && !ValidationUtils.isInAllowedList(frequency, VALID_FREQUENCIES)) {
      errors.push({
        row: rowNumber,
        field: 'Frequency',
        message: `Invalid frequency. Allowed: ${VALID_FREQUENCIES.join(', ')}`
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
    const controlArea = normalizeValue(columnMap['controlArea'] ? row[columnMap['controlArea']] : row['ControlArea']);
    const ownerName = normalizeValue(columnMap['ownerName'] ? row[columnMap['ownerName']] : row['OwnerName']);
    const frequency = normalizeValue(columnMap['frequency'] ? row[columnMap['frequency']] : row['Frequency']);
    const riskRating = normalizeValue(columnMap['riskRating'] ? row[columnMap['riskRating']] : row['RiskRating']);
    const dueAt = normalizeValue(columnMap['dueAt'] ? row[columnMap['dueAt']] : row['DueAt']);
    const evidenceUrl = normalizeValue(columnMap['evidenceUrl'] ? row[columnMap['evidenceUrl']] : row['EvidenceUrl']);

    return {
      title,
      controlArea,
      ownerName,
      frequency: frequency || 'Quarterly',
      riskRating: riskRating || 'MEDIUM',
      dueAt: dueAt || undefined,
      evidenceUrl: evidenceUrl || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Compliance Executor
// ============================================================================

class ComplianceImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'compliance control';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const control = await createComplianceControl({
        title: input.title as string,
        controlArea: input.controlArea as string,
        ownerName: input.ownerName as string,
        frequency: input.frequency as string | undefined,
        riskRating: input.riskRating as string | undefined,
        dueAt: input.dueAt as Date | string | null | undefined,
        evidenceUrl: input.evidenceUrl as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: control.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const complianceValidator = new ComplianceImportValidator();
const complianceExecutor = new ComplianceImportExecutor();

export function registerComplianceImport(): void {
  registerImportModule('compliance', () => complianceValidator, () => complianceExecutor);
}

export { complianceValidator, complianceExecutor };
