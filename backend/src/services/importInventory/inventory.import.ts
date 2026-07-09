/**
 * Inventory (Assets) Import Module
 * Implements the import framework for Inventory/Assets module.
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
import { createAsset } from '../asset.service.js';

// ============================================================================
// Inventory Validator
// ============================================================================

class InventoryImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      assetType: ['asset type', 'asset_type', 'type', 'category', 'kind'],
      make: ['make', 'manufacturer', 'vendor', 'brand'],
      model: ['model', 'model name', 'model_name', 'product'],
      serialNo: ['serial no', 'serial_no', 'serial number', 'serial', 'sn'],
      assignedToName: ['assigned to', 'assigned_to', 'assigned', 'user', 'employee'],
      location: ['location', 'location', 'site', 'office', 'room']
    };
  }

  getRequiredFields(): string[] {
    return ['assetType'];
  }

  protected getEntityName(): string {
    return 'asset';
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
    const assetType = normalizeValue(columnMap['assetType'] ? row[columnMap['assetType']] : row['AssetType']);
    const make = normalizeValue(columnMap['make'] ? row[columnMap['make']] : row['Make']);
    const model = normalizeValue(columnMap['model'] ? row[columnMap['model']] : row['Model']);
    const serialNo = normalizeValue(columnMap['serialNo'] ? row[columnMap['serialNo']] : row['SerialNo']);
    const assignedToName = normalizeValue(columnMap['assignedToName'] ? row[columnMap['assignedToName']] : row['AssignedToName']);
    const location = normalizeValue(columnMap['location'] ? row[columnMap['location']] : row['Location']);

    return {
      assetType,
      make: make || undefined,
      model: model || undefined,
      serialNo: serialNo || undefined,
      assignedToName: assignedToName || undefined,
      location: location || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Inventory Executor
// ============================================================================

class InventoryImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'asset';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const asset = await createAsset({
        assetType: input.assetType as string,
        make: input.make as string | null | undefined,
        model: input.model as string | null | undefined,
        serialNo: input.serialNo as string | null | undefined,
        assignedToName: input.assignedToName as string | null | undefined,
        location: input.location as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: asset.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const inventoryValidator = new InventoryImportValidator();
const inventoryExecutor = new InventoryImportExecutor();

export function registerInventoryImport(): void {
  registerImportModule('inventory', () => inventoryValidator, () => inventoryExecutor);
}

export { inventoryValidator, inventoryExecutor };
