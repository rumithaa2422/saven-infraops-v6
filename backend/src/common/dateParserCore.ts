/**
 * Core Date Parsing Implementation
 * 
 * This module contains the actual parsing logic used by all imports.
 * Single source of truth for date parsing.
 */

// Month names for parsing text formats
const MONTH_NAMES: Record<string, number> = {
  'jan': 0, 'january': 0,
  'feb': 1, 'february': 1,
  'mar': 2, 'march': 2,
  'apr': 3, 'april': 3,
  'may': 4,
  'jun': 5, 'june': 5,
  'jul': 6, 'july': 6,
  'aug': 7, 'august': 7,
  'sep': 8, 'sept': 8, 'september': 8,
  'oct': 9, 'october': 9,
  'nov': 10, 'november': 10,
  'dec': 11, 'december': 11
};

/**
 * Excel serial date limits
 * Valid Excel serial dates are typically in range ~1 to ~60,000 (1900 to ~2060)
 */
const EXCEL_MIN_SERIAL = 1;
const EXCEL_MAX_SERIAL = 100000; // ~year 2173

/**
 * Valid date range for the application
 */
const MIN_VALID_TIME = Date.UTC(1900, 0, 1); // Jan 1, 1900
const MAX_VALID_TIME = Date.UTC(2100, 0, 1); // Jan 1, 2100

/**
 * Empty value patterns - these return null
 */
const EMPTY_PATTERNS = ['', 'null', 'undefined', 'n/a', 'na', '-', '.', 'none', 'empty'];

/**
 * Parse month name and return month index (0-11) or -1 if not found
 */
function parseMonthName(monthStr: string): number {
  const lower = monthStr.toLowerCase().trim();
  return MONTH_NAMES[lower] ?? -1;
}

/**
 * Check if a string is empty or a placeholder value
 */
function isEmptyValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return EMPTY_PATTERNS.includes(trimmed);
}

/**
 * Check if a timestamp is within valid range
 */
function isTimeInValidRange(time: number): boolean {
  return time >= MIN_VALID_TIME && time < MAX_VALID_TIME;
}

/**
 * Check if a value looks like an Excel serial date (as number)
 * Accepts integers and decimals
 */
function isExcelSerialNumber(value: number): boolean {
  if (Number.isNaN(value)) return false;
  if (!Number.isFinite(value)) return false;
  if (value < EXCEL_MIN_SERIAL || value > EXCEL_MAX_SERIAL) return false;
  return true;
}

/**
 * Check if a string looks like an Excel serial date
 * Excel serials are typically 5-digit numbers (40000-50000 for 2009-2036)
 */
function looksLikeExcelSerial(value: string): boolean {
  const trimmed = value.trim();
  // Excel serials are positive numbers, typically 5 digits
  if (/^\d{4,6}(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    return isExcelSerialNumber(num);
  }
  return false;
}

/**
 * Convert Excel serial date to JavaScript Date
 * Formula: new Date((serial - 25569) * 86400 * 1000)
 * 
 * This handles:
 * - Integer Excel serials (46162)
 * - Decimal Excel serials (46162.5 = midday)
 * - String Excel serials ("46162")
 */
function excelSerialToDate(serial: number): Date | null {
  // Excel serial 25569 = January 1, 1970 (Unix epoch)
  // Formula: Date = (ExcelSerial - 25569) * 86400 seconds
  const msPerDay = 24 * 60 * 60 * 1000;
  const milliseconds = (serial - 25569) * msPerDay;
  const date = new Date(milliseconds);
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

/**
 * Parse a text date format like "dd MMM yyyy" or "MMMM dd, yyyy"
 */
function parseTextDate(value: string): Date | null {
  const trimmed = value.trim();
  
  // Pattern: dd MMM yyyy or dd-MMM-yyyy or dd.MMM.yyyy (e.g., "20 Jul 2026", "20-Jul-2026")
  // Also: dd MMMM yyyy (e.g., "20 July 2026")
  const ddMmmYyyy = /^(\d{1,2})[\s\-\.]?([a-zA-Z]+)[\s\,\-\.]?(\d{4})$/;
  let match = trimmed.match(ddMmmYyyy);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseMonthName(match[2]);
    const year = parseInt(match[3], 10);
    
    if (month >= 0 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime()) && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  
  // Pattern: MMM dd yyyy or MMMM dd yyyy (e.g., "Jul 20 2026", "July 20, 2026")
  const mmmDdYyyy = /^([a-zA-Z]+)[\s]?(\d{1,2})[\s\,]?[\d]?(\d{4})$/;
  match = trimmed.match(mmmDdYyyy);
  if (match) {
    const month = parseMonthName(match[1]);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    if (month >= 0 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime()) && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  
  return null;
}

/**
 * Parse numeric date formats with separators
 * Supports: dd/MM/yyyy, MM/dd/yyyy, dd-MM-yyyy, MM-dd-yyyy
 */
function parseNumericDate(value: string): Date | null {
  const trimmed = value.trim();
  
  // Pattern: dd/MM/yyyy or dd-MM-yyyy
  const numericPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const match = trimmed.match(numericPattern);
  
  if (!match) return null;
  
  const first = parseInt(match[1], 10);
  const second = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Validate year
  if (year < 1900 || year > 2100) return null;
  
  // Determine format based on values
  // If first > 12, it's definitely dd/MM/yyyy
  if (first > 12 && second >= 1 && second <= 12) {
    const date = new Date(Date.UTC(year, second - 1, first));
    if (!isNaN(date.getTime()) && date.getUTCDate() === first) {
      return date;
    }
  }
  // If second > 12, it's definitely MM/dd/yyyy
  else if (second > 12 && first >= 1 && first <= 12) {
    const date = new Date(Date.UTC(year, first - 1, second));
    if (!isNaN(date.getTime()) && date.getUTCDate() === second) {
      return date;
    }
  }
  // Ambiguous case (both <= 12) - try dd/MM/yyyy first (international default)
  else if (first >= 1 && first <= 31 && second >= 1 && second <= 12) {
    // Try dd/MM/yyyy
    const date = new Date(Date.UTC(year, second - 1, first));
    if (!isNaN(date.getTime()) && date.getUTCDate() === first && date.getUTCMonth() === second - 1) {
      return date;
    }
  }
  
  return null;
}

/**
 * Parse ISO date format
 * Accepts: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ssZ, etc.
 */
function parseIsoDate(value: string): Date | null {
  const trimmed = value.trim();
  
  // Must start with 4-digit year
  if (!/^\d{4}/.test(trimmed)) return null;
  
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;
  
  // Validate it's actually ISO format (year 1900-2100)
  const year = date.getUTCFullYear();
  if (year < 1900 || year > 2100) return null;
  
  return date;
}

/**
 * Main parsing function - handles ALL formats
 * 
 * @param value - The value to parse (Date, string, number, null, undefined)
 * @returns A valid JavaScript Date, or null if empty/invalid
 */
export function parseDate(value: unknown): Date | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }
  
  // Handle JavaScript Date object - accept directly
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return null;
    }
    if (!isTimeInValidRange(value.getTime())) {
      return null;
    }
    return value;
  }
  
  // Handle numbers (Excel serials or timestamps)
  if (typeof value === 'number') {
    // Check if it's an Excel serial number
    if (isExcelSerialNumber(value)) {
      const date = excelSerialToDate(value);
      if (date && isTimeInValidRange(date.getTime())) {
        return date;
      }
    }
    
    // Try as Unix timestamp (milliseconds)
    // Only accept if it's in a reasonable range
    if (value > 0 && isTimeInValidRange(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  }
  
  // Handle strings
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Check for empty values first
    if (isEmptyValue(trimmed)) {
      return null;
    }
    
    // Skip obviously invalid values
    if (trimmed.startsWith('+') || /^[^\d\w\s\-\/\.\:,]+$/.test(trimmed)) {
      // Looks like random characters or starts with +
      return null;
    }
    
    // Try Excel serial (string form like "46162")
    if (looksLikeExcelSerial(trimmed)) {
      const serial = parseFloat(trimmed);
      const date = excelSerialToDate(serial);
      if (date && isTimeInValidRange(date.getTime())) {
        return date;
      }
    }
    
    // Try ISO format
    const isoDate = parseIsoDate(trimmed);
    if (isoDate) {
      return isoDate;
    }
    
    // Try text date (dd MMM yyyy)
    const textDate = parseTextDate(trimmed);
    if (textDate) {
      return textDate;
    }
    
    // Try numeric date (dd/MM/yyyy, MM/dd/yyyy)
    const numericDate = parseNumericDate(trimmed);
    if (numericDate) {
      return numericDate;
    }
    
    // Last resort: try native JavaScript Date parsing
    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime()) && isTimeInValidRange(fallback.getTime())) {
      return fallback;
    }
    
    return null;
  }
  
  return null;
}

/**
 * Validate a date value without parsing
 * Returns true if the value can be successfully parsed as a valid date
 */
export function isValidDate(value: unknown): boolean {
  return parseDate(value) !== null;
}

/**
 * Parse a date value and throw a user-friendly error if invalid
 * 
 * @param value - The value to parse
 * @param fieldName - The field name for error messages
 * @returns A valid JavaScript Date or null for empty values
 * @throws Error with user-friendly message for invalid dates
 */
export function parseDateOrThrow(value: unknown, fieldName: string): Date | null {
  // Empty values return null (never throw)
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string' && isEmptyValue(value.trim())) {
    return null;
  }
  
  const parsed = parseDate(value);
  
  if (parsed === null) {
    const displayName = fieldName || 'Date';
    const displayValue = typeof value === 'string' ? value : String(value);
    throw new Error(`Invalid ${displayName}: "${displayValue}" is not a valid date. Please provide a valid calendar date.`);
  }
  
  return parsed;
}

/**
 * Format a date for display in error messages
 */
export function formatDateForError(value: unknown): string {
  if (value === null || value === undefined) {
    return 'empty';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number') {
    return `serial number ${value}`;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}
