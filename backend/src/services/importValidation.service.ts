import { prisma } from '../common/prisma.js';

// Allowed departments from the schema
const ALLOWED_DEPARTMENTS = [
  'Engineering',
  'Support',
  'QA',
  'DevOps',
  'HR',
  'Finance',
  'Operations',
  'Security',
  'InfraOps'
];

// Email regex for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation error for a single row
 */
export interface RowError {
  row: number;
  field: string;
  message: string;
}

/**
 * Validation result for a single row
 */
export interface RowValidation {
  row: number;
  valid: boolean;
  data: Record<string, unknown>;
  errors: RowError[];
}

/**
 * Overall validation result
 */
export interface ValidationResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  summary: {
    allValid: boolean;
    message: string;
  };
  rows: RowValidation[];
  errorsByRow: Record<number, string[]>;
}

/**
 * Trim and normalize a value
 */
function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Check if a row is completely empty
 */
function isEmptyRow(row: Record<string, unknown>, columns: string[]): boolean {
  return columns.every(col => {
    const value = normalizeValue(row[col]);
    return value === '';
  });
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate users data from parsed Excel/CSV
 */
export async function validateUsersImport(data: Record<string, unknown>[]): Promise<ValidationResult> {
  const rows: RowValidation[] = [];
  const errorsByRow: Record<number, string[]> = {};
  let validRows = 0;
  let invalidRows = 0;

  // Get existing emails from database
  const existingUsers = await prisma.user.findMany({
    select: { email: true }
  });
  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

  // Get existing role names from database
  const existingRoles = await prisma.role.findMany({
    select: { name: true }
  });
  const existingRoleNames = new Set(existingRoles.map(r => r.name));

  // Column name variations (case-insensitive matching)
  const columnVariations: Record<string, string[]> = {
    name: ['name', 'user name', 'username', 'full name', 'fullname', 'user'],
    email: ['email', 'email address', 'e-mail', 'mail'],
    phone: ['phone', 'phone number', 'phonenumber', 'mobile', 'contact', 'telephone'],
    department: ['department', 'dept', 'division', 'team'],
    role: ['role', 'user role', 'userrole', 'access level']
  };

  // Find actual column names in the data
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  
  function findColumn(key: string): string | undefined {
    const variations = columnVariations[key] || [key];
    const lowerColumns = columns.map(c => c.toLowerCase().trim());
    
    for (const variation of variations) {
      const index = lowerColumns.indexOf(variation.toLowerCase());
      if (index !== -1) {
        return columns[index];
      }
    }
    return undefined;
  }

  // Validate each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 because row 1 is headers, and we want 1-based index for user
    const errors: RowError[] = [];

    // Check if row is empty
    if (isEmptyRow(row, columns)) {
      // Skip empty rows - don't count them as invalid
      rows.push({
        row: rowNumber,
        valid: true,
        data: row,
        errors: []
      });
      continue;
    }

    // Find column names for each field
    const nameCol = findColumn('name');
    const emailCol = findColumn('email');
    const phoneCol = findColumn('phone');
    const departmentCol = findColumn('department');
    const roleCol = findColumn('role');

    // Normalize values
    const name = normalizeValue(nameCol ? row[nameCol] : row['Name']);
    const email = normalizeValue(emailCol ? row[emailCol] : row['Email']).toLowerCase();
    const phone = normalizeValue(phoneCol ? row[phoneCol] : row['Phone']);
    const department = normalizeValue(departmentCol ? row[departmentCol] : row['Department']);
    const role = normalizeValue(roleCol ? row[roleCol] : row['Role']);

    // Validate Name (required)
    if (!name) {
      errors.push({
        row: rowNumber,
        field: 'Name',
        message: 'Name is required'
      });
    }

    // Validate Email (required and format)
    if (!email) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        message: 'Email is required'
      });
    } else if (!isValidEmail(email)) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        message: 'Invalid email format'
      });
    } else if (existingEmails.has(email.toLowerCase())) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        message: 'Email already exists in the system'
      });
    }

    // Validate Department (required and must be in allowed list)
    if (!department) {
      errors.push({
        row: rowNumber,
        field: 'Department',
        message: 'Department is required'
      });
    } else if (!ALLOWED_DEPARTMENTS.includes(department)) {
      errors.push({
        row: rowNumber,
        field: 'Department',
        message: `Invalid department. Allowed: ${ALLOWED_DEPARTMENTS.join(', ')}`
      });
    }

    // Validate Role (required and must exist in Roles table)
    if (!role) {
      errors.push({
        row: rowNumber,
        field: 'Role',
        message: 'Role is required'
      });
    } else if (!existingRoleNames.has(role)) {
      errors.push({
        row: rowNumber,
        field: 'Role',
        message: `Role not found. Available: ${[...existingRoleNames].join(', ')}`
      });
    }

    const isValid = errors.length === 0;

    if (isValid) {
      validRows++;
    } else {
      invalidRows++;
      errorsByRow[rowNumber] = errors.map(e => e.message);
    }

    rows.push({
      row: rowNumber,
      valid: isValid,
      data: {
        name,
        email,
        phone: phone || undefined,
        department,
        role
      },
      errors
    });
  }

  const allValid = invalidRows === 0;
  let message: string;

  if (allValid) {
    message = `All ${validRows} row(s) are valid and ready for import.`;
  } else {
    message = `Found ${invalidRows} row(s) with errors. Please fix them before importing.`;
  }

  return {
    success: allValid,
    totalRows: data.length,
    validRows,
    invalidRows,
    summary: {
      allValid,
      message
    },
    rows,
    errorsByRow
  };
}

/**
 * Validate import data for a specific module
 */
export async function validateImport(
  moduleType: string,
  data: Record<string, unknown>[]
): Promise<ValidationResult> {
  switch (moduleType) {
    case 'users-teams':
      return validateUsersImport(data);
    // Future modules can be added here:
    // case 'incidents':
    //   return validateIncidentsImport(data);
    // case 'service-requests':
    //   return validateServiceRequestsImport(data);
    default:
      throw new Error(`Validation for module '${moduleType}' is not implemented yet.`);
  }
}
