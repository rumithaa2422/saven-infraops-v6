/**
 * Vendors (Vendor Licenses) Import Module
 * Implements the import framework for Vendors module.
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
import { createVendorLicense } from '../vendorLicense.service.js';

// ============================================================================
// Vendors Validator
// ============================================================================

class VendorsImportValidator extends BaseImportValidator {
  getColumnMappings(): ColumnMapping {
    return {
      vendorName: ['vendor name', 'vendor_name', 'vendor', 'company', 'supplier'],
      licenseName: ['license name', 'license_name', 'license', 'product', 'software'],
      licenseCount: ['license count', 'license_count', 'total licenses', 'total', 'quantity', 'seats'],
      assignedCount: ['assigned count', 'assigned_count', 'assigned', 'used', 'allocated'],
      cost: ['cost', 'price', 'amount', 'fee', 'license cost'],
      renewalAt: ['renewal at', 'renewal_at', 'renewal date', 'renewal', 'expiry date', 'expires'],
      ownerName: ['owner', 'owner name', 'owner_name', 'responsible', 'license manager']
    };
  }

  getRequiredFields(): string[] {
    return ['vendorName', 'licenseName'];
  }

  protected getEntityName(): string {
    return 'vendor license';
  }

  protected getModuleDisplayName(): string {
    return 'Vendors';
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
    const vendorName = normalizeValue(columnMap['vendorName'] ? row[columnMap['vendorName']] : row['VendorName']);
    const licenseName = normalizeValue(columnMap['licenseName'] ? row[columnMap['licenseName']] : row['LicenseName']);
    const licenseCount = normalizeValue(columnMap['licenseCount'] ? row[columnMap['licenseCount']] : row['LicenseCount']);
    const assignedCount = normalizeValue(columnMap['assignedCount'] ? row[columnMap['assignedCount']] : row['AssignedCount']);
    const cost = normalizeValue(columnMap['cost'] ? row[columnMap['cost']] : row['Cost']);
    const renewalAt = normalizeValue(columnMap['renewalAt'] ? row[columnMap['renewalAt']] : row['RenewalAt']);
    const ownerName = normalizeValue(columnMap['ownerName'] ? row[columnMap['ownerName']] : row['OwnerName']);

    return {
      vendorName,
      licenseName,
      licenseCount: licenseCount ? parseInt(licenseCount, 10) : undefined,
      assignedCount: assignedCount ? parseInt(assignedCount, 10) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      renewalAt: renewalAt || undefined,
      ownerName: ownerName || undefined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Vendors Executor
// ============================================================================

class VendorsImportExecutor extends BaseImportExecutor {
  protected getEntityName(): string {
    return 'vendor license';
  }

  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    try {
      const vendor = await createVendorLicense({
        vendorName: input.vendorName as string,
        licenseName: input.licenseName as string,
        licenseCount: input.licenseCount as number | undefined,
        assignedCount: input.assignedCount as number | undefined,
        cost: input.cost as number | null | undefined,
        renewalAt: input.renewalAt as Date | string | null | undefined,
        ownerName: input.ownerName as string | null | undefined
      });

      return createImportRecordResult(true, input, { id: vendor.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const vendorsValidator = new VendorsImportValidator();
const vendorsExecutor = new VendorsImportExecutor();

export function registerVendorsImport(): void {
  registerImportModule('vendors', () => vendorsValidator, () => vendorsExecutor);
}

export { vendorsValidator, vendorsExecutor };
