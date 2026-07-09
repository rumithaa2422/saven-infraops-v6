/**
 * Problems Import Module
 * Implements the import framework for Problems module.
 */

import {
  BaseImportValidator,
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
import { createProblem } from '../problem.service.js';

// ============================================================================
// Problems Validator
// ============================================================================

class ProblemsImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      title: ['title', 'subject', 'summary', 'name', 'problem title'],
      ownerName: ['owner', 'owner name', 'owner_name', 'assigned to', 'assignee', 'responsible'],
      description: ['description', 'details', 'notes', 'body', 'problem description'],
      rootCause: ['root cause', 'root_cause', 'cause', 'reason']
    };
  }

  getRequiredFields(): string[] {
    return ['title'];
  }

  protected getEntityName(): string {
    return 'problem';
  }

  protected validateRowData(
    _row: Record<string, unknown>,
    _rowNumber: number,
    _context: ValidationContext,
    _columnMap: Record<string, string | undefined>
  ): FieldError[] {
    return [];
  }

  protected normalizeRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): ImportInput {
    const title = normalizeValue(columnMap['title'] ? row[columnMap['title']] : row['Title']);
    const ownerName = normalizeValue(columnMap['ownerName'] ? row[columnMap['ownerName']] : row['OwnerName']);
    const description = normalizeValue(columnMap['description'] ? row[columnMap['description']] : row['Description']);
    const rootCause = normalizeValue(columnMap['rootCause'] ? row[columnMap['rootCause']] : row['RootCause']);

    return {
      title,
      ownerName: ownerName || undefined,
      description: description || undefined,
      rootCause: rootCause || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Problems Executor
// ============================================================================

class ProblemsImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'problem';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const problem = await createProblem({
        title: input.title as string,
        ownerName: input.ownerName as string | null | undefined,
        description: input.description as string | null | undefined,
        rootCause: input.rootCause as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: problem.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const problemsValidator = new ProblemsImportValidator();
const problemsExecutor = new ProblemsImportExecutor();

export function registerProblemsImport(): void {
  registerImportModule('problems', () => problemsValidator, () => problemsExecutor);
}

export { problemsValidator, problemsExecutor };
