import { prisma } from '../common/prisma.js';
import { HttpError } from '../common/httpError.js';
import { sendUserActivationEmail } from '../modules/auth/activation.service.js';
import { parseDate, parseDateOrThrow } from '../common/dateParser.js';

export interface CreateUserInput {
  name: string;
  email: string;
  phoneNumber?: string | null;
  department?: string | null;
  employeeId?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  dateJoined?: string | null;
  address?: string | null;
  remarks?: string | null;
  team?: string | null;
  roleId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function createUser(data: CreateUserInput) {
  try {
    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new HttpError(400, 'A user with this email already exists');
    }

    // Validate and parse dateJoined with user-friendly error message
    let parsedDateJoined: Date | null = null;
    if (data.dateJoined) {
      try {
        parsedDateJoined = parseDateOrThrow(data.dateJoined, 'dateJoined');
      } catch (err) {
        throw new HttpError(400, err instanceof Error ? err.message : 'Invalid dateJoined value');
      }
    }

    // Create user with PENDING_ACTIVATION status (no password)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        department: data.department || null,
        employeeId: data.employeeId || null,
        designation: data.designation || null,
        employmentType: data.employmentType || null,
        dateJoined: parsedDateJoined,
        address: data.address || null,
        remarks: data.remarks || null,
        team: data.team || null,
        status: 'PENDING_ACTIVATION'
      }
    });

    // Assign role if provided
    if (data.roleId) {
      // roleId might be the role name, so look it up
      const role = await prisma.role.findFirst({
        where: {
          OR: [
            { id: data.roleId },
            { name: data.roleId }
          ]
        }
      });
      if (role) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: role.id }
        });
      }
    }

    // Send activation email (don't fail user creation if email fails)
    try {
      await sendUserActivationEmail(user.id);
    } catch (emailError) {
      console.error('Failed to send activation email:', emailError);
      // Continue anyway - user is created, email can be resent later
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: data.actorId || 'system',
          actorEmail: data.actorEmail || 'system',
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          newValue: { email: user.email, status: 'PENDING_ACTIVATION' }
        }
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail user creation for audit log errors
    }

    return user;
  } catch (error) {
    // Re-throw HttpError as-is
    if (error instanceof HttpError) {
      throw error;
    }
    // Wrap other errors in HttpError to prevent 500
    const message = error instanceof Error ? error.message : 'Failed to create user';
    console.error('User creation error:', error);
    throw new HttpError(500, message);
  }
}

export interface UpdateUserInput {
  name?: string;
  department?: string | null;
  status?: 'PENDING_ACTIVATION' | 'ACTIVE' | 'DISABLED' | 'LOCKED';
  phoneNumber?: string | null;
  employeeId?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  dateJoined?: string | null;
  address?: string | null;
  remarks?: string | null;
  roleId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'User not found');
  }

  // Validate and parse dateJoined with user-friendly error message
  let parsedDateJoined: Date | null | undefined = undefined;
  if (data.dateJoined !== undefined) {
    if (data.dateJoined) {
      try {
        parsedDateJoined = parseDateOrThrow(data.dateJoined, 'dateJoined');
      } catch (err) {
        throw new HttpError(400, err instanceof Error ? err.message : 'Invalid dateJoined value');
      }
    } else {
      parsedDateJoined = null;
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      department: data.department !== undefined ? (data.department || null) : undefined,
      status: data.status,
      phoneNumber: data.phoneNumber !== undefined ? (data.phoneNumber || null) : undefined,
      employeeId: data.employeeId !== undefined ? (data.employeeId || null) : undefined,
      designation: data.designation !== undefined ? (data.designation || null) : undefined,
      employmentType: data.employmentType !== undefined ? (data.employmentType || null) : undefined,
      dateJoined: parsedDateJoined,
      address: data.address !== undefined ? (data.address || null) : undefined,
      remarks: data.remarks !== undefined ? (data.remarks || null) : undefined
    }
  });

  // Update role if provided
  if (data.roleId !== undefined) {
    // Remove existing roles
    await prisma.userRole.deleteMany({ where: { userId: id } });
    
    // Add new role if provided
    if (data.roleId) {
      const role = await prisma.role.findFirst({
        where: {
          OR: [
            { id: data.roleId },
            { name: data.roleId }
          ]
        }
      });
      if (role) {
        await prisma.userRole.create({
          data: { userId: id, roleId: role.id }
        });
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user.id,
      oldValue: { email: existing.email } as any,
      newValue: { email: user.email, status: user.status } as any,
      ipAddress: data.ipAddress || null
    }
  });

  return user;
}

export interface DeleteUserInput {
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export async function deleteUser(id: string, data: DeleteUserInput) {
  // Find the user
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Prevent self-deletion
  if (data.actorId === id) {
    throw new HttpError(400, 'Cannot delete your own account');
  }

  // Prevent deletion of Super Admin account
  if (user.email === 'admin@saven.in') {
    throw new HttpError(400, 'Cannot delete the admin user');
  }

  // Check for ServiceRequest references
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: {
      OR: [
        { requesterId: id },
        { assigneeId: id }
      ]
    }
  });

  if (serviceRequests.length > 0) {
    throw new HttpError(400, 'User cannot be deleted because tickets are associated with this account.');
  }

  // Delete related UserRole records
  await prisma.userRole.deleteMany({
    where: { userId: id }
  });

  // Delete related UserActivationToken records
  await prisma.userActivationToken.deleteMany({
    where: { userId: id }
  });

  // Hard delete the user
  await prisma.user.delete({
    where: { id }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: user.id,
      oldValue: { email: user.email } as any,
      newValue: null as any,
      ipAddress: data.ipAddress || null
    }
  });

  return { success: true };
}
