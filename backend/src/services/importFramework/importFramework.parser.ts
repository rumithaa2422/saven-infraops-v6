/**
 * Import Framework - File Parser
 * 
 * Handles parsing of Excel (.xlsx) and CSV files.
 * This is a reusable utility that can be used by all import modules.
 */

import * as XLSX from 'xlsx';
import { ParsedData } from './importFramework.types.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed MIME types for import
 */
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
] as const;

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'] as const;

/**
 * Default preview row limit
 */
export const DEFAULT_PREVIEW_LIMIT = 10;

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Check if a MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number]);
}

/**
 * Check if a file extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);
}

/**
 * Validate file type based on MIME type or extension
 */
export function validateFileType(filename: string, mimeType: string): boolean {
  if (isAllowedMimeType(mimeType)) return true;
  if (isAllowedExtension(filename)) return true;
  return false;
}

/**
 * Parse Excel/CSV file buffer into JSON data
 * 
 * @param buffer - File buffer
 * @returns Parsed data with metadata
 * @throws Error if file is invalid, corrupted, or empty
 */
export function parseFile(buffer: Buffer): ParsedData {
  let workbook: XLSX.WorkBook;
  
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    throw new Error('Invalid or corrupted Excel file');
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('No worksheet found in the file');
  }

  // Convert sheet to JSON using header row
  const sheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { 
    defval: '',
    raw: false
  });

  if (sheetData.length === 0) {
    throw new Error('File is empty or has no data rows');
  }

  const columns = Object.keys(sheetData[0]);

  if (columns.length === 0) {
    throw new Error('No columns found. File may be missing a header row.');
  }

  // Filter out completely empty rows
  const data = sheetData.filter(row => {
    return columns.some(col => {
      const value = row[col];
      return value !== undefined && value !== null && value !== '';
    });
  });

  return {
    columns,
    data,
    totalRows: data.length,
    sheetName
  };
}

/**
 * Get preview data (limited rows)
 */
export function getPreviewData(data: ParsedData, limit: number = DEFAULT_PREVIEW_LIMIT): Record<string, unknown>[] {
  return data.data.slice(0, limit);
}

/**
 * Check if file should return preview only
 */
export function isPreviewData(totalRows: number, limit: number = DEFAULT_PREVIEW_LIMIT): boolean {
  return totalRows > limit;
}

/**
 * Normalize a value (trim whitespace)
 */
export function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Check if a row is completely empty
 */
export function isEmptyRow(row: Record<string, unknown>, columns: string[]): boolean {
  return columns.every(col => {
    const value = normalizeValue(row[col]);
    return value === '';
  });
}

/**
 * Find column name from column mappings
 * 
 * @param columns - Available column names from the file
 * @param mappings - Column name variations to look for
 * @returns The actual column name found, or undefined
 */
export function findColumn(columns: string[], mappings: Record<string, string[]>): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  const lowerColumns = columns.map(c => c.toLowerCase().trim());

  for (const [fieldName, variations] of Object.entries(mappings)) {
    for (const variation of variations) {
      const index = lowerColumns.indexOf(variation.toLowerCase());
      if (index !== -1) {
        result[fieldName] = columns[index];
        break;
      }
    }
  }

  return result;
}

/**
 * Get column value by field name
 */
export function getColumnValue(
  row: Record<string, unknown>,
  columnMap: Record<string, string | undefined>,
  fieldName: string,
  defaultKey?: string
): string {
  const colName = columnMap[fieldName] || defaultKey;
  if (!colName) return '';
  return normalizeValue(row[colName]);
}

/**
 * Create a reusable column mapper function
 */
export function createColumnMapper(defaultMappings: Record<string, string[]>) {
  return (columns: string[]) => findColumn(columns, defaultMappings);
}
