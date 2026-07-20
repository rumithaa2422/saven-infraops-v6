/**
 * Users Import Module
 * 
 * Implements the import framework for Users & Teams module.
 * This file plugs into the reusable import framework.
 */

import { prisma } from '../../common/prisma.js';
import {
  BaseImportValidator,
  ValidationUtils,
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
import { createUser } from '../user.service.js';
import { parseDate, isValidDate } from '../../common/dateParser.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed departments
 */
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

// ============================================================================
// Users Validator
// ============================================================================

class UsersImportValidator extends BaseImportValidator {
  /**
   * Column name variations for flexible matching
   */
  getColumnMappings(): ColumnMapping {
    return {
      name: ['name', 'user name', 'username', 'full name', 'fullname', 'user'],
      email: ['email', 'email address', 'e-mail', 'mail'],
      phone: ['phone', 'phone number', 'phonenumber', 'mobile', 'contact', 'telephone'],
      department: ['department', 'dept', 'division', 'team'],
      role: ['role', 'user role', 'userrole', 'access level'],
      dateJoined: ['date joined', 'datejoined', 'joining date', 'join date', 'start date', 'startdate', 'doj']
    };
  }

  /**
   * Required fields
   */
  getRequiredFields(): string[] {
    return ['name', 'email', 'department', 'role'];
  }

  /**
   * Optional date fields that should be validated
   */
  protected getDateFields(): string[] {
    return ['dateJoined'];
  }

  /**
   * Entity name for messages
   */
  protected getEntityName(): string {
    return 'user';
  }

  /**
   * Module display name for error messages
   */
  protected getModuleDisplayName(): string {
    return 'Users & Teams';
  }

  /**
   * Build validation context with database lookups
   */
  async buildContext(): Promise<ValidationContext> {
    // Get existing emails
    const existingUsers = await prisma.user.findMany({
      select: { email: true }
    });
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // Get existing role names
    const existingRoles = await prisma.role.findMany({
      select: { name: true }
    });
    const existingRoleNames = new Set(existingRoles.map(r => r.name));

    return {
      existingValues: {
        email: existingEmails,
        role: existingRoleNames
      }
    };
  }

  /**
   * Validate date fields for a row
   */
  protected validateDateFields(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): FieldError[] {
    const errors: FieldError[] = [];
    const dateFields = this.getDateFields();

    for (const field of dateFields) {
      const colName = columnMap[field];
      if (colName) {
        const value = row[colName];
        // Check if value exists and is not empty
        if (value !== undefined && value !== null && value !== '') {
          // Try to parse the date - if it fails, report error
          if (!isValidDate(value)) {
            const displayValue = typeof value === 'string' ? value : String(value);
            errors.push({
              row: rowNumber,
              field: this.formatFieldName(field),
              message: `Invalid date. Please provide a valid calendar date. (Value: "${displayValue}")`
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate row-specific rules
   */
  protected validateRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    context: ValidationContext,
    columnMap: Record<string, string | undefined>
  ): FieldError[] {
    const errors: FieldError[] = [];
    const existingValues = context.existingValues || {};

    // Get email
    const email = normalizeValue(columnMap['email'] ? row[columnMap['email']] : row['Email']).toLowerCase();

    // Validate email format
    if (email && !ValidationUtils.isValidEmail(email)) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        message: 'Invalid email format'
      });
    }

    // Check email uniqueness
    const existingEmails = existingValues['email'];
    if (email && existingEmails && ValidationUtils.valueExists(email, existingEmails)) {
      errors.push({
        row: rowNumber,
        field: 'Email',
        message: 'Email already exists in the system'
      });
    }

    // Get department
    const department = normalizeValue(columnMap['department'] ? row[columnMap['department']] : row['Department']);

    // Validate department
    if (department && !ValidationUtils.isInAllowedList(department, ALLOWED_DEPARTMENTS)) {
      errors.push({
        row: rowNumber,
        field: 'Department',
        message: `Invalid department. Allowed: ${ALLOWED_DEPARTMENTS.join(', ')}`
      });
    }

    // Get role
    const role = normalizeValue(columnMap['role'] ? row[columnMap['role']] : row['Role']);

    // Validate role exists
    const existingRoles = existingValues['role'];
    if (role && existingRoles && !ValidationUtils.valueExists(role, existingRoles)) {
      errors.push({
        row: rowNumber,
        field: 'Role',
        message: `Role not found. Available: ${[...existingRoles].join(', ')}`
      });
    }

    // Validate date fields
    errors.push(...this.validateDateFields(row, rowNumber, columnMap));

    return errors;
  }

  /**
   * Normalize row data for import
   */
  protected normalizeRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): ImportInput {
    const name = normalizeValue(columnMap['name'] ? row[columnMap['name']] : row['Name']);
    const email = normalizeValue(columnMap['email'] ? row[columnMap['email']] : row['Email']).toLowerCase();
    const phone = normalizeValue(columnMap['phone'] ? row[columnMap['phone']] : row['Phone']);
    const department = normalizeValue(columnMap['department'] ? row[columnMap['department']] : row['Department']);
    const role = normalizeValue(columnMap['role'] ? row[columnMap['role']] : row['Role']);
    
    // Get dateJoined and parse it
    const dateJoinedCol = columnMap['dateJoined'];
    let dateJoined: string | undefined;
    if (dateJoinedCol && row[dateJoinedCol] !== undefined && row[dateJoinedCol] !== null && row[dateJoinedCol] !== '') {
      const parsed = parseDate(row[dateJoinedCol]);
      if (parsed) {
        dateJoined = parsed.toISOString();
      }
    }

    return {
      name,
      email,
      phoneNumber: phone || undefined,
      department,
      role,
      dateJoined,
      importedRow: rowNumber
    };
  }
}

// ============================================================================
// Users Executor
// ============================================================================

class UsersImportExecutor extends BaseImportExecutor {
  /**
   * Entity name for messages
   */
  protected getEntityName(): string {
    return 'user';
  }

  /**
   * Import a single user
   * Reuses createUser() service to ensure:
   * - Duplicate email validation
   * - Role assignment
   * - Audit logging
   * - Activation email
   */
  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    const { name, email, phoneNumber, department, role, dateJoined } = input as {
      name: string;
      email: string;
      phoneNumber?: string;
      department: string;
      role: string;
      dateJoined?: string;
    };

    try {
      // Reuse the existing createUser service
      // This handles: email uniqueness, user creation, role assignment, audit log, activation email
      const user = await createUser({
        name,
        email,
        phoneNumber: phoneNumber || null,
        department: department || null,
        roleId: role || null,
        dateJoined: dateJoined || null,
        actorId: 'system',
        actorEmail: 'system'
      });

      return createImportRecordResult(true, input, { id: user.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return createImportRecordResult(false, input, { error: errorMessage });
    }
  }
}

// ============================================================================
// Module Registration
// ============================================================================

const usersValidator = new UsersImportValidator();
const usersExecutor = new UsersImportExecutor();

/**
 * Register the Users import module
 * Call this during application startup
 */
export function registerUsersImport(): void {
  registerImportModule('users-teams', () => usersValidator, () => usersExecutor);
}

/**
 * Get the users validator instance
 */
export function getUsersValidator(): UsersImportValidator {
  return usersValidator;
}

/**
 * Get the users executor instance
 */
export function getUsersExecutor(): UsersImportExecutor {
  return usersExecutor;
}

// Also export for backward compatibility
export { usersValidator, usersExecutor };
