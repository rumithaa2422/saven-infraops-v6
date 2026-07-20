/**
 * Users Import Module
 * 
 * Implements the import framework for Users & Teams module.
 * This file plugs into the reusable import framework.
 * 
 * CRITICAL: Validation and Import use the SAME validation pipeline.
 * If validation passes, import MUST succeed.
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
import { parseDate } from '../../common/dateParser.js';

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
// Shared Validation State (for debug logging)
// ============================================================================

interface ValidationError {
  row: number;
  field: string;
  value?: string;
  message: string;
}

// ============================================================================
// Unified Validation Function
// 
// This function is used by BOTH:
// 1. The validator (during Preview/Validate phase)
// 2. The executor (during Import phase - for debug logging only)
// 
// The import NEVER re-validates. It only inserts.
// ============================================================================

/**
 * Validate a single user row and return detailed errors
 */
export function validateUserRow(
  row: Record<string, unknown>,
  rowNumber: number,
  columnMap: Record<string, string | undefined>,
  existingEmails: Set<string>,
  existingRoleNames: Set<string>
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Get field values
  const name = normalizeValue(columnMap['name'] ? row[columnMap['name']] : row['Name']);
  const email = normalizeValue(columnMap['email'] ? row[columnMap['email']] : row['Email']).toLowerCase();
  const phone = normalizeValue(columnMap['phone'] ? row[columnMap['phone']] : row['Phone']);
  const department = normalizeValue(columnMap['department'] ? row[columnMap['department']] : row['Department']);
  const role = normalizeValue(columnMap['role'] ? row[columnMap['role']] : row['Role']);
  const employeeId = normalizeValue(columnMap['employeeId'] ? row[columnMap['employeeId']] : row['EmployeeId']);
  const designation = normalizeValue(columnMap['designation'] ? row[columnMap['designation']] : row['Designation']);
  const dateJoinedCol = columnMap['dateJoined'];
  const dateJoinedValue = dateJoinedCol ? row[dateJoinedCol] : row['DateJoined'];

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
  } else if (!ValidationUtils.isValidEmail(email)) {
    errors.push({
      row: rowNumber,
      field: 'Email',
      value: email,
      message: `Invalid email format: "${email}"`
    });
  } else if (existingEmails && existingEmails.has(email.toLowerCase())) {
    errors.push({
      row: rowNumber,
      field: 'Email',
      value: email,
      message: `Duplicate Email: "${email}"`
    });
  }

  // Validate Department (required and must be in allowed list)
  if (!department) {
    errors.push({
      row: rowNumber,
      field: 'Department',
      message: 'Department is required'
    });
  } else if (!ValidationUtils.isInAllowedList(department, ALLOWED_DEPARTMENTS)) {
    errors.push({
      row: rowNumber,
      field: 'Department',
      value: department,
      message: `Department "${department}" does not exist. Allowed: ${ALLOWED_DEPARTMENTS.join(', ')}`
    });
  }

  // Validate Role (required and must exist)
  if (!role) {
    errors.push({
      row: rowNumber,
      field: 'Role',
      message: 'Role is required'
    });
  } else if (existingRoleNames && !ValidationUtils.valueExists(role, existingRoleNames)) {
    errors.push({
      row: rowNumber,
      field: 'Role',
      value: role,
      message: `Role "${role}" does not exist. Available roles: ${[...existingRoleNames].join(', ')}`
    });
  }

  // Validate Date Joined (optional, but must be valid if provided)
  if (dateJoinedValue !== undefined && dateJoinedValue !== null && dateJoinedValue !== '') {
    const parsedDate = parseDate(dateJoinedValue);
    if (!parsedDate) {
      const displayValue = typeof dateJoinedValue === 'string' ? dateJoinedValue : String(dateJoinedValue);
      errors.push({
        row: rowNumber,
        field: 'Date Joined',
        value: displayValue,
        message: `Invalid Date: "${displayValue}". Please provide a valid calendar date.`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Normalize a user row for import (parse dates, etc.)
 */
export function normalizeUserRow(
  row: Record<string, unknown>,
  rowNumber: number,
  columnMap: Record<string, string | undefined>
): ImportInput {
  const name = normalizeValue(columnMap['name'] ? row[columnMap['name']] : row['Name']);
  const email = normalizeValue(columnMap['email'] ? row[columnMap['email']] : row['Email']).toLowerCase();
  const phone = normalizeValue(columnMap['phone'] ? row[columnMap['phone']] : row['Phone']);
  const department = normalizeValue(columnMap['department'] ? row[columnMap['department']] : row['Department']);
  const role = normalizeValue(columnMap['role'] ? row[columnMap['role']] : row['Role']);
  const employeeId = normalizeValue(columnMap['employeeId'] ? row[columnMap['employeeId']] : row['EmployeeId']);
  const designation = normalizeValue(columnMap['designation'] ? row[columnMap['designation']] : row['Designation']);
  const dateJoinedCol = columnMap['dateJoined'];
  const dateJoinedValue = dateJoinedCol ? row[dateJoinedCol] : row['DateJoined'];

  // Parse date if provided
  let dateJoined: string | undefined;
  if (dateJoinedValue !== undefined && dateJoinedValue !== null && dateJoinedValue !== '') {
    const parsedDate = parseDate(dateJoinedValue);
    if (parsedDate) {
      dateJoined = parsedDate.toISOString();
    }
  }

  return {
    name,
    email,
    phoneNumber: phone || undefined,
    department,
    role,
    employeeId: employeeId || undefined,
    designation: designation || undefined,
    dateJoined,
    importedRow: rowNumber
  };
}

// ============================================================================
// Users Validator
// ============================================================================

class UsersImportValidator extends BaseImportValidator {
  private existingEmails: Set<string> = new Set();
  private existingRoleNames: Set<string> = new Set();

  /**
   * Column name variations for flexible matching
   */
  getColumnMappings(): ColumnMapping {
    return {
      name: ['Name', 'name', 'user name', 'username', 'full name', 'fullname', 'user'],
      email: ['Email', 'email', 'email address', 'e-mail', 'mail'],
      phone: ['Phone', 'phone', 'phone number', 'phonenumber', 'mobile', 'contact', 'telephone'],
      department: ['Department', 'department', 'dept', 'division', 'team'],
      role: ['Role', 'role', 'user role', 'userrole', 'access level'],
      employeeId: ['EmployeeId', 'Employee Id', 'employee id', 'employee_id', 'emp_id'],
      designation: ['Designation', 'designation', 'title', 'job title'],
      dateJoined: ['Date Joined', 'date joined', 'datejoined', 'joining date', 'join date', 'start date', 'startdate', 'doj']
    };
  }

  /**
   * Required fields
   */
  getRequiredFields(): string[] {
    return ['name', 'email', 'department', 'role'];
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
    this.existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    // Get existing role names
    const existingRoles = await prisma.role.findMany({
      select: { name: true }
    });
    this.existingRoleNames = new Set(existingRoles.map(r => r.name));

    return {
      existingValues: {
        email: this.existingEmails,
        role: this.existingRoleNames
      }
    };
  }

  /**
   * Validate row-specific rules using unified validation
   */
  protected validateRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    context: ValidationContext,
    columnMap: Record<string, string | undefined>
  ): FieldError[] {
    const existingValues = context.existingValues || {};
    const existingEmails = existingValues['email'] as Set<string> || this.existingEmails;
    const existingRoleNames = existingValues['role'] as Set<string> || this.existingRoleNames;

    const result = validateUserRow(row, rowNumber, columnMap, existingEmails, existingRoleNames);

    // Convert ValidationError to FieldError
    return result.errors.map(err => ({
      row: err.row,
      field: err.field,
      message: err.message
    }));
  }

  /**
   * Normalize row data for import
   */
  protected normalizeRowData(
    row: Record<string, unknown>,
    rowNumber: number,
    columnMap: Record<string, string | undefined>
  ): ImportInput {
    return normalizeUserRow(row, rowNumber, columnMap);
  }
}

// ============================================================================
// Users Executor
// 
// CRITICAL: The executor does NOT re-validate.
// It trusts the validation that already passed.
// It only performs database operations.
// ============================================================================

class UsersImportExecutor extends BaseImportExecutor {
  /**
   * Entity name for messages
   */
  protected getEntityName(): string {
    return 'user';
  }

  /**
   * Import a single user directly to database
   * NO re-validation - data was already validated
   */
  async importRecord(input: ImportInput): Promise<ImportRecordResult> {
    const {
      name,
      email,
      phoneNumber,
      department,
      role,
      employeeId,
      designation,
      dateJoined
    } = input as {
      name: string;
      email: string;
      phoneNumber?: string;
      department: string;
      role: string;
      employeeId?: string;
      designation?: string;
      dateJoined?: string;
    };

    // Parse dateJoined
    let parsedDateJoined: Date | null = null;
    if (dateJoined) {
      const parsed = parseDate(dateJoined);
      parsedDateJoined = parsed;
    }

    // DEBUG LOG: Show what we're about to insert
    console.log('=== IMPORT DEBUG ===');
    console.log({
      row: input.importedRow,
      employeeId,
      email,
      name,
      department,
      role,
      designation,
      dateJoined,
      dateJoined_parsed: parsedDateJoined?.toISOString() || null
    });

    try {
      // Create user directly with Prisma
      // The data has already been validated - we just insert
      const user = await prisma.user.create({
        data: {
          name,
          email,
          phoneNumber: phoneNumber || null,
          department: department || null,
          employeeId: employeeId || null,
          designation: designation || null,
          employmentType: null,
          dateJoined: parsedDateJoined,
          address: null,
          remarks: null,
          team: null,
          status: 'PENDING_ACTIVATION'
        }
      });

      // DEBUG LOG: Show what was inserted
      console.log('=== USER CREATED ===');
      console.log({
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        dateJoined: user.dateJoined
      });

      // Assign role if provided (roles were validated to exist)
      if (role) {
        const roleRecord = await prisma.role.findFirst({
          where: {
            OR: [
              { id: role },
              { name: role }
            ]
          }
        });

        if (roleRecord) {
          await prisma.userRole.create({
            data: { userId: user.id, roleId: roleRecord.id }
          });
          console.log('=== ROLE ASSIGNED ===');
          console.log({ roleId: roleRecord.id, roleName: roleRecord.name });
        }
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorId: 'system',
          actorEmail: 'system',
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          newValue: { email: user.email, status: 'PENDING_ACTIVATION', source: 'import' }
        }
      });

      console.log('=== IMPORT SUCCESS ===');

      return createImportRecordResult(true, input, { id: user.id });

    } catch (error: any) {
      // DETAILED ERROR LOGGING
      console.error('=== IMPORT FAILED ===');
      console.error('Row:', input.importedRow);
      console.error('Employee ID:', employeeId);
      console.error('Email:', email);
      console.error('Name:', name);
      console.error('Department:', department);
      console.error('Role:', role);
      console.error('Date Joined:', dateJoined);
      console.error('Parsed Date:', parsedDateJoined?.toISOString());
      console.error('Error:', error.message);
      console.error('Error Code:', error.code);
      console.error('Error Meta:', error.meta);

      // Check for Prisma specific errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        return {
          row: input.importedRow || 0,
          success: false,
          identifier: email,
          id: undefined,
          error: `Duplicate Email: "${email}"`,
          details: {
            row: input.importedRow,
            field: 'Email',
            value: email,
            reason: 'A user with this email already exists in the database'
          }
        };
      }

      if (error.code === 'P2003') {
        // Foreign key constraint
        return {
          row: input.importedRow || 0,
          success: false,
          identifier: email,
          id: undefined,
          error: `Role "${role}" not found in database`,
          details: {
            row: input.importedRow,
            field: 'Role',
            value: role,
            reason: 'The specified role does not exist'
          }
        };
      }

      // Generic error - return as much detail as possible
      return {
        row: input.importedRow || 0,
        success: false,
        identifier: email,
        id: undefined,
        error: error.message || 'Unknown error during import',
        details: {
          row: input.importedRow,
          employeeId,
          email,
          name,
          department,
          role,
          dateJoined,
          errorCode: error.code,
          reason: error.message
        }
      };
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
