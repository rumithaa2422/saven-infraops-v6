import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import { sendActivationEmail } from '../../common/email.js';
import { env } from '../../config/env.js';

const TOKEN_EXPIRATION_HOURS = 24;

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createActivationToken(userId: string): Promise<string> {
  // Delete any existing tokens for this user
  await prisma.userActivationToken.deleteMany({ where: { userId } });

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000);

  await prisma.userActivationToken.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return token;
}

export async function sendUserActivationEmail(userId: string): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const token = await createActivationToken(userId);
  const activationUrl = `${env.FRONTEND_ORIGIN}/activate-account?token=${token}`;

  const result = await sendActivationEmail(user, activationUrl);

  // Log the activation email sent event
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      actorEmail: user.email,
      action: 'ACTIVATION_EMAIL_SENT',
      entityType: 'User',
      entityId: user.id,
      newValue: { email: user.email }
    }
  });

  return result;
}

export async function validateActivationToken(token: string): Promise<{ valid: boolean; error?: string; userId?: string }> {
  const activationToken = await prisma.userActivationToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!activationToken) {
    return { valid: false, error: 'Invalid activation token' };
  }

  if (activationToken.used) {
    return { valid: false, error: 'This activation link has already been used' };
  }

  if (new Date() > activationToken.expiresAt) {
    return { valid: false, error: 'This activation link has expired. Please contact administrator for a new activation link.' };
  }

  return { valid: true, userId: activationToken.userId };
}

export async function activateUserWithPassword(token: string, password: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> {
  // Validate password match
  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match' };
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  // Validate token
  const tokenValidation = await validateActivationToken(token);
  if (!tokenValidation.valid) {
    return { success: false, error: tokenValidation.error };
  }

  const userId = tokenValidation.userId!;

  try {
    // Hash password and activate user
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          status: 'ACTIVE'
        }
      }),
      prisma.userActivationToken.update({
        where: { token },
        data: { used: true }
      })
    ]);

    // Log activation completed
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorEmail: (await prisma.user.findUnique({ where: { id: userId } }))?.email || null,
        action: 'ACTIVATION_COMPLETED',
        entityType: 'User',
        entityId: userId,
        newValue: { status: 'ACTIVE' }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Activation error:', error);
    return { success: false, error: 'Failed to activate account' };
  }
}

export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}
