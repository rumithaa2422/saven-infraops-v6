/**
 * Incidents Import Module
 * Implements the import framework for Incidents module.
 */

import {
  BaseImportValidator,
  ValidationUtils,
  BaseImportExecutor,
  createImportRecordResult,
  registerImportModule
} from '../importFramework/importFramework.index.js';
import {
  FieldError,
  ValidationContext,
  ImportInput,
  ImportRecordResult,
  ColumnMapping
} from '../importFramework/importFramework.types.js';
import { normalizeValue } from '../importFramework/importFramework.parser.js';
import { createIncident } from '../incident.service.js';

// Severity levels
const VALID_SEVERITIES = ['SEV1', 'SEV2', 'SEV3', 'SEV4'];

// ============================================================================
// Incidents Validator
// ============================================================================

class IncidentsImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      title: ['title', 'subject', 'summary', 'name'],
      severity: ['severity', 'priority', 'urgency', 'impact'],
      impactedService: ['impacted service', 'impacted_service', 'service', 'affected service'],
      impactedProject: ['impacted project', 'impacted_project', 'project', 'affected project'],
      ownerName: ['owner', 'owner name', 'owner_name', 'assigned to', 'assignee'],
      description: ['description', 'details', 'notes', 'body']
    };
  }

  getRequiredFields(): string[] {
    return ['title'];
  }

  protected getEntityName(): string {
    return 'incident';
  }

  protected validateRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    _context: ValidationContext,
    columnMap: Record<string, string | undefined>
  ): FieldError[] {
    const errors: FieldError[] = [];

    const severity = normalizeValue(columnMap['severity'] ? row[columnMap['severity']] : row['Severity']);

    if (severity && !ValidationUtils.isInAllowedList(severity, VALID_SEVERITIES)) {
      errors.push({
        row: rowNumber,
        field: 'Severity',
        message: `Invalid severity. Allowed: ${VALID_SEVERITIES.join(', ')}`
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
    const severity = normalizeValue(columnMap['severity'] ? row[columnMap['severity']] : row['Severity']);
    const impactedService = normalizeValue(columnMap['impactedService'] ? row[columnMap['impactedService']] : row['ImpactedService']);
    const impactedProject = normalizeValue(columnMap['impactedProject'] ? row[columnMap['impactedProject']] : row['ImpactedProject']);
    const ownerName = normalizeValue(columnMap['ownerName'] ? row[columnMap['ownerName']] : row['OwnerName']);
    const description = normalizeValue(columnMap['description'] ? row[columnMap['description']] : row['Description']);

    return {
      title,
      severity: severity || 'SEV3',
      impactedService: impactedService || undefined,
      impactedProject: impactedProject || undefined,
      ownerName: ownerName || undefined,
      description: description || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Incidents Executor
// ============================================================================

class IncidentsImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'incident';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const incident = await createIncident({
        title: input.title as string,
        severity: input.severity as string | undefined,
        impactedService: input.impactedService as string | null | undefined,
        impactedProject: input.impactedProject as string | null | undefined,
        ownerName: input.ownerName as string | null | undefined,
        description: input.description as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: incident.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const incidentsValidator = new IncidentsImportValidator();
const incidentsExecutor = new IncidentsImportExecutor();

export function registerIncidentsImport(): void {
  registerImportModule('incidents', () => incidentsValidator, () => incidentsExecutor);
}

export { incidentsValidator, incidentsExecutor };
