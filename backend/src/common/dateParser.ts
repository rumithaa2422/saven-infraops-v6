/**
 * Robust Date Parsing Utility
 * 
 * Handles ALL common date formats:
 * 1. Excel serial numbers (integer or decimal, as number or string)
 * 2. ISO format (2026-07-20, 2026-07-20T10:30:00Z)
 * 3. dd/MM/yyyy (20/07/2026)
 * 4. dd-MM-yyyy (20-07-2026)
 * 5. MM/dd/yyyy (07/20/2026)
 * 6. MM-dd-yyyy (07-20-2026)
 * 7. dd MMM yyyy (20 Jul 2026)
 * 8. dd MMMM yyyy (20 July 2026)
 * 9. MMM dd yyyy (Jul 20 2026)
 * 10. MMMM dd yyyy (July 20 2026)
 * 11. JavaScript Date objects
 * 12. Unix timestamps in milliseconds
 * 
 * Empty values return null (never throw).
 * Invalid values throw with user-friendly message.
 */

import { parseDate as parseDateCore } from './dateParserCore.js';

export { parseDateCore as parseDate };
export { isValidDate, parseDateOrThrow, formatDateForError } from './dateParserCore.js';
