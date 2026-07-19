import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelData {
  headers: string[];
  rows: Record<string, unknown>[];
  reportName: string;
}

export function generateExcel(data: ExcelData): Buffer {
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();

  // Prepare data with headers as first row (Array of Arrays)
  const worksheetData: unknown[][] = [];

  // Add header row
  worksheetData.push(data.headers);

  // Add data rows - each row is an array of values in the same order as headers
  for (const row of data.rows) {
    const rowValues: unknown[] = [];
    for (const header of data.headers) {
      // Direct lookup - the header should match the key exactly
      const value = row[header];
      rowValues.push(value !== undefined ? value : '');
    }
    worksheetData.push(rowValues);
  }

  // Create worksheet from data using aoa_to_sheet (Array of Arrays)
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths based on content
  const colWidths: XLSX.ColInfo[] = [];
  for (let i = 0; i < data.headers.length; i++) {
    let maxLength = data.headers[i].length;
    for (const row of data.rows) {
      const header = data.headers[i];
      const value = row[header];
      const valueLength = value ? String(value).length : 0;
      if (valueLength > maxLength) maxLength = Math.min(valueLength, 50);
    }
    colWidths.push({ wch: maxLength + 2 });
  }
  worksheet['!cols'] = colWidths;

  // Freeze the first row (header row)
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  // Generate buffer with proper xlsx format
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true });

  return buffer as Buffer;
}

export function formatHeaderKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
    .trim();
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString();
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
