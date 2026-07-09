import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';
import { sendUserActivationEmail } from '../modules/auth/activation.service.js';

/**
 * Input for importing a single user
 */
export interface ImportUserInput {
  name: string;
  email: string;
  phoneNumber?: string | null;
  department?: string | null;
  role?: string | null;
  importedRow?: number;
}

/**
 * Result for a single imported user
 */
export interface ImportUserResult {
  row: number;
  success: boolean;
  email: string;
  userId?: string;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

/**
 * Overall import result
 */
export interface ImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  failed: number;
  skipped: number;
  results: ImportUserResult[];
  summary: {
    allSuccessful: boolean;
    message: string;
  };
}

/**
 * Create a user from import (reuses existing business logic)
 * This function is used internally by the import service
 */
async function createUserFromImport(data: ImportUserInput): Promise<{ userId: string }> {
  // Create user with PENDING_ACTIVATION status
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber || null,
      department: data.department || null,
      status: 'PENDING_ACTIVATION'
    }
  });

  // Assign role if provided
  if (data.role) {
    const role = await prisma.role.findFirst({
      where: {
        OR: [
          { id: data.role },
          { name: data.role }
        ]
      }
    });
    if (role) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id }
      });
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

  return { userId: user.id };
}

/**
 * Import validated users into the system
 * Continues even if individual rows fail
 * Does NOT rollback on email failure - just records the error
 */
export async function importUsers(users: ImportUserInput[]): Promise<ImportResult> {
  const results: ImportUserResult[] = [];
  let imported = 0;
  let failed = 0;
  let skipped = 0;

  // Process each user
  for (const userData of users) {
    const row = userData.importedRow || results.length + 1;
    
    try {
      // Create the user (reuses business logic)
      const { userId } = await createUserFromImport(userData);

      // Try to send activation email (but don't fail if it doesn't work)
      let emailSent = false;
      let emailError: string | undefined;

      try {
        const emailResult = await sendUserActivationEmail(userId);
        emailSent = emailResult.success;
        if (!emailResult.success && emailResult.error) {
          emailError = emailResult.error;
          console.error(`Failed to send activation email for ${userData.email}:`, emailResult.error);
        }
      } catch (emailErr) {
        emailError = emailErr instanceof Error ? emailErr.message : 'Unknown email error';
        console.error(`Exception sending activation email for ${userData.email}:`, emailErr);
      }

      results.push({
        row,
        success: true,
        email: userData.email,
        userId,
        emailSent,
        emailError
      });

      imported++;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's a duplicate email error (shouldn't happen after validation, but just in case)
      if (err instanceof HttpError && err.message.includes('already exists')) {
        results.push({
          row,
          success: false,
          email: userData.email,
          error: 'Email already exists in the system'
        });
      } else {
        results.push({
          row,
          success: false,
          email: userData.email,
          error: errorMessage
        });
      }

      failed++;
    }
  }

  const allSuccessful = failed === 0;
  let message: string;

  if (allSuccessful) {
    const emailsFailed = results.filter(r => r.success && !r.emailSent).length;
    if (emailsFailed > 0) {
      message = `Successfully imported ${imported} user(s). ${emailsFailed} activation email(s) failed to send.`;
    } else {
      message = `Successfully imported ${imported} user(s).`;
    }
  } else {
    message = `Imported ${imported} user(s), ${failed} failed.`;
  }

  return {
    success: allSuccessful,
    totalRows: users.length,
    imported,
    failed,
    skipped,
    results,
    summary: {
      allSuccessful,
      message
    }
  };
}
