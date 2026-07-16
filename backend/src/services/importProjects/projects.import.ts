/**
 * Projects (Project Environments) Import Module
 * Implements the import framework for Projects module.
 */

import {
  BaseImportValidator,
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
import { createProjectEnvironment } from '../projectEnvironment.service.js';

// ============================================================================
// Projects Validator
// ============================================================================

class ProjectsImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      projectName: ['project name', 'project_name', 'project', 'program'],
      projectCode: ['project code', 'project_code', 'code', 'proj code', 'proj_code'],
      environmentName: ['environment name', 'environment_name', 'environment', 'env', 'stage'],
      serviceName: ['service name', 'service_name', 'service', 'application'],
      serverName: ['server name', 'server_name', 'server', 'hostname', 'host'],
      databaseName: ['database name', 'database_name', 'database', 'db'],
      ownerName: ['owner', 'owner name', 'owner_name', 'responsible', 'lead']
    };
  }

  getRequiredFields(): string[] {
    return ['projectName', 'projectCode'];
  }

  protected getEntityName(): string {
    return 'project environment';
  }

  protected getModuleDisplayName(): string {
    return 'Projects';
  }

  protected validateRowData(
    _row: Record<string, unknown>,
    _rowNumber: number,
    _context: import('../importFramework/importFramework.types.js').ValidationContext,
    _columnMap: Record<string, string | undefined>
  ): import('../importFramework/importFramework.types.js').FieldError[] {
    return [];
  }

  protected normalizeRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): ImportInput {
    const projectName = normalizeValue(columnMap['projectName'] ? row[columnMap['projectName']] : row['ProjectName']);
    const environmentName = normalizeValue(columnMap['environmentName'] ? row[columnMap['environmentName']] : row['EnvironmentName']);
    const serviceName = normalizeValue(columnMap['serviceName'] ? row[columnMap['serviceName']] : row['ServiceName']);
    const serverName = normalizeValue(columnMap['serverName'] ? row[columnMap['serverName']] : row['ServerName']);
    const databaseName = normalizeValue(columnMap['databaseName'] ? row[columnMap['databaseName']] : row['DatabaseName']);
    const ownerName = normalizeValue(columnMap['ownerName'] ? row[columnMap['ownerName']] : row['OwnerName']);

    return {
      projectName,
      environmentName,
      serviceName: serviceName || undefined,
      serverName: serverName || undefined,
      databaseName: databaseName || undefined,
      ownerName: ownerName || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Projects Executor
// ============================================================================

class ProjectsImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'project environment';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const project = await createProjectEnvironment({
        projectName: input.projectName as string,
        projectCode: input.projectCode as string,
        environmentName: input.environmentName as string,
        serviceName: input.serviceName as string | null | undefined,
        serverName: input.serverName as string | null | undefined,
        databaseName: input.databaseName as string | null | undefined,
        ownerName: input.ownerName as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: project.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const projectsValidator = new ProjectsImportValidator();
const projectsExecutor = new ProjectsImportExecutor();

export function registerProjectsImport(): void {
  registerImportModule('projects', () => projectsValidator, () => projectsExecutor);
}

export { projectsValidator, projectsExecutor };
