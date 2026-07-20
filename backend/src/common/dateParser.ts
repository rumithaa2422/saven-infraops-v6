/**
 * Robust Date Parsing Utility
 * 
 * Handles parsing of various date formats commonly encountered in imports:
 * - yyyy-MM-dd, dd-MM-yyyy, MM-dd-yyyy
 * - dd/MM/yyyy, MM/dd/yyyy
 * - dd MMM yyyy, dd MMMM yyyy (e.g., "14 May 2026", "14 May 2026")
 * - MMM dd yyyy, MMMM dd yyyy (e.g., "May 14 2026", "May 14 2026")
 * - ISO timestamps (e.g., "2023-12-31T10:00:00Z")
 * - JavaScript Date objects
 * - Excel serial date numbers (e.g., 45154)
 * - Empty or null values (returns null)
 * - Invalid dates (returns null)
 * 
 * This ensures Prisma never receives invalid DateTime values.
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
 * Excel epoch for serial date calculation
 * Excel counts days from January 1, 1900 (but has a bug for 1900 - it thinks Feb 29, 1900 exists)
 * Serial 1 = January 1, 1900
 */
const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30, 0, 0, 0, 0));

/**
 * Excel serial date limits - valid Excel serial dates are typically in range 1 to ~60,000
 * (covering 1900-01-01 to ~2060)
 * We use a conservative range to catch obviously invalid values
 */
const EXCEL_MIN_SERIAL = 1;
const EXCEL_MAX_SERIAL = 100000; // Covers up to ~2173

/**
 * Maximum reasonable value for numbers treated as milliseconds
 * (Jan 1, 2050 = 2588025600000 ms)
 */
const MAX_MILLISECONDS = 3000000000000; // ~Jan 1, 2065

/**
 * Valid date range for the application (in milliseconds since epoch)
 */
const MIN_VALID_TIME = Date.UTC(1900, 0, 1); // Jan 1, 1900
const MAX_VALID_TIME = Date.UTC(2100, 0, 1); // Jan 1, 2100

/**
 * Check if a value looks like an Excel serial date number
 */
function isExcelSerialDate(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  if (!Number.isInteger(value)) return false;
  if (value < EXCEL_MIN_SERIAL || value > EXCEL_MAX_SERIAL) return false;
  return true;
}

/**
 * Convert Excel serial date number to JavaScript Date
 * Excel serial dates start at 1 = January 1, 1900
 */
function excelSerialToDate(serial: number): Date {
  const date = new Date(EXCEL_EPOCH.getTime() + serial * 24 * 60 * 60 * 1000);
  return date;
}

/**
 * Check if a timestamp is within valid range
 */
function isTimeInValidRange(time: number): boolean {
  return time >= MIN_VALID_TIME && time < MAX_VALID_TIME;
}

/**
 * Parse month name and return month index (0-11) or -1 if not found
 */
function parseMonth(monthStr: string): number {
  const lower = monthStr.toLowerCase();
  return MONTH_NAMES[lower] ?? -1;
}

/**
 * Parse a text date format like "dd MMM yyyy" or "MMMM dd, yyyy"
 * Supported patterns:
 * - dd MMM yyyy (e.g., "14 May 2026")
 * - dd MMMM yyyy (e.g., "14 May 2026")
 * - MMM dd, yyyy (e.g., "May 14, 2026")
 * - MMMM dd, yyyy (e.g., "May 14, 2026")
 * - dd-MMM-yyyy (e.g., "14-May-2026")
 * - MMM dd yyyy (e.g., "May 14 2026")
 */
function parseTextDateFormat(value: string): Date | null {
  // Pattern: dd MMM yyyy or dd-MMM-yyyy (e.g., "14 May 2026", "14-May-2026")
  const ddMmmYyyyPattern = /^(\d{1,2})[\s\-]?([a-zA-Z]+)[\s\-,](\d{4})$/;
  let match = value.match(ddMmmYyyyPattern);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseMonth(match[2]);
    const year = parseInt(match[3], 10);
    if (month >= 0 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Pattern: MMM dd yyyy or MMMM dd yyyy (e.g., "May 14 2026", "May 14, 2026")
  const mmmDdYyyyPattern = /^([a-zA-Z]+)[\s]?(\d{1,2})[\s,]?(\d{4})$/;
  match = value.match(mmmDdYyyyPattern);
  if (match) {
    const month = parseMonth(match[1]);
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (month >= 0 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime())) {
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
function parseNumericDateFormat(value: string): Date | null {
  // Try dd/MM/yyyy or dd-MM-yyyy
  let match = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const first = parseInt(match[1], 10);
    const second = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    // Validate year
    if (year < 1900 || year > 2100) return null;

    // Try to determine format based on values
    // If first > 12, it's definitely dd/MM/yyyy
    if (first > 12 && second <= 12 && second >= 1) {
      const date = new Date(Date.UTC(year, second - 1, first));
      if (!isNaN(date.getTime()) && date.getUTCDate() === first) {
        return date;
      }
    }
    // If second > 12, it's definitely MM/dd/yyyy
    else if (second > 12 && first <= 12 && first >= 1) {
      const date = new Date(Date.UTC(year, first - 1, second));
      if (!isNaN(date.getTime()) && date.getUTCDate() === second) {
        return date;
      }
    }
    // Ambiguous case - default to ISO interpretation (yyyy-MM-dd) or dd/MM/yyyy
    // We default to dd/MM/yyyy for ambiguous cases in an international context
    else {
      // Try as dd/MM/yyyy
      if (first >= 1 && first <= 31 && second >= 1 && second <= 12) {
        const date = new Date(Date.UTC(year, second - 1, first));
        if (!isNaN(date.getTime()) && date.getUTCDate() === first) {
          return date;
        }
      }
      // Try as MM/dd/yyyy
      if (second >= 1 && second <= 31 && first >= 1 && first <= 12) {
        const date = new Date(Date.UTC(year, first - 1, second));
        if (!isNaN(date.getTime()) && date.getUTCDate() === second) {
          return date;
        }
      }
    }
  }

  return null;
}

/**
 * Check if a string is a valid ISO date format
 * Accepts: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, YYYY-MM-DDTHH:mm:ssZ, etc.
 */
function isValidIsoDateFormat(value: string): boolean {
  // Basic ISO date pattern: YYYY-MM-DD or with time
  const isoPattern = /^\d{4}-\d{2}-\d{2}/;
  if (!isoPattern.test(value)) return false;
  
  // Try parsing as date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Robustly parse a date value from various sources
 * 
 * @param value - The value to parse (Date, string, number, null, undefined)
 * @returns A valid JavaScript Date, or null if the value is empty/invalid
 */
export function parseDate(value: unknown): Date | null {
  // Handle null/undefined/empty
  if (value === null || value === undefined) {
    return null;
  }

  // Handle empty string
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  // Handle JavaScript Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      return null;
    }
    // Validate the date is in a reasonable range
    if (!isTimeInValidRange(value.getTime())) {
      return null;
    }
    return value;
  }

  // Handle Excel serial date number
  if (isExcelSerialDate(value)) {
    const date = excelSerialToDate(value as number);
    if (isNaN(date.getTime())) {
      return null;
    }
    // Validate the resulting date is in a reasonable range
    if (!isTimeInValidRange(date.getTime())) {
      return null;
    }
    return date;
  }

  // Handle string values
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Skip obviously invalid values (like the problematic +045154-12-31T18:30:00.000Z)
    if (trimmed.startsWith('+')) {
      return null;
    }
    
    // Try ISO format first (YYYY-MM-DD or with time)
    if (isValidIsoDateFormat(trimmed)) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime()) && isTimeInValidRange(date.getTime())) {
        return date;
      }
    }
    
    // Try text date format (dd MMM yyyy, May 14 2026, etc.)
    const textDate = parseTextDateFormat(trimmed);
    if (textDate !== null) {
      if (isTimeInValidRange(textDate.getTime())) {
        return textDate;
      }
    }
    
    // Try numeric date format (dd/MM/yyyy, MM/dd/yyyy, etc.)
    const numericDate = parseNumericDateFormat(trimmed);
    if (numericDate !== null) {
      if (isTimeInValidRange(numericDate.getTime())) {
        return numericDate;
      }
    }
    
    // Last resort: try native JavaScript Date parsing
    const date = new Date(trimmed);
    if (!isNaN(date.getTime()) && isTimeInValidRange(date.getTime())) {
      return date;
    }
    
    return null;
  }

  // Handle number - could be Excel serial or milliseconds
  // Reject numbers that would result in invalid dates (outside our range)
  if (typeof value === 'number') {
    // Reject negative numbers (not valid for any date format we support)
    if (value < 0) {
      return null;
    }
    
    // Reject unreasonably large numbers (likely not valid dates)
    if (value > MAX_MILLISECONDS) {
      return null;
    }
    
    // Numbers less than EXCEL_MAX_SERIAL might be Excel serials, but we already checked
    // those above. For other numbers, treat as milliseconds.
    // But only accept if the resulting date is in our valid range.
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      if (isTimeInValidRange(date.getTime())) {
        return date;
      }
    }
  }

  return null;
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
  const parsed = parseDate(value);
  
  if (parsed === null) {
    // Check if value was provided but invalid
    if (value !== null && value !== undefined && value !== '') {
      const displayName = fieldName || 'Date';
      const displayValue = typeof value === 'string' ? value : String(value);
      throw new Error(`Invalid ${displayName}: "${displayValue}" is not a valid date. Please provide a valid calendar date.`);
    }
    // Empty value is allowed (returns null)
    return null;
  }
  
  return parsed;
}

/**
 * Validate a date value without parsing
 * Returns true if the value can be successfully parsed as a valid date
 */
export function isValidDate(value: unknown): boolean {
  return parseDate(value) !== null;
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
