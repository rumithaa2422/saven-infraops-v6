import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { loginWithPassword } from './auth.service.js';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../common/prisma.js';
import { HttpError } from '../../common/httpError.js';
import { 
  validateActivationToken, 
  activateUserWithPassword,
  sendUserActivationEmail 
} from './activation.service.js';

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post('/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginWithPassword(payload.email, payload.password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

authRouter.get('/microsoft/start', (_req, res) => {
  res.status(501).json({
    message: 'Microsoft login is configured as an extension point. Add Entra tenant, client, secret, redirect URL, and OAuth implementation.'
  });
});

// Schema for changing password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1)
});

// POST /auth/change-password - Change user password
authRouter.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const payload = changePasswordSchema.parse(req.body);
    const userId = req.user!.id;
    
    // Validate password confirmation
    if (payload.newPassword !== payload.confirmPassword) {
      throw new HttpError(400, 'New passwords do not match');
    }
    
    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, passwordHash: true }
    });
    
    if (!user) {
      throw new HttpError(404, 'User not found');
    }
    
    // Verify current password
    if (!user.passwordHash) {
      throw new HttpError(400, 'No password set. Please contact administrator.');
    }
    
    const isValidPassword = await bcrypt.compare(payload.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new HttpError(401, 'Current password is incorrect');
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(payload.newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
    
    // Log the password change
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorEmail: user.email,
        action: 'PASSWORD_CHANGE',
        entityType: 'User',
        entityId: userId,
        newValue: { timestamp: new Date().toISOString() }
      }
    });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

// Activation endpoints
authRouter.get('/activate/validate/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await validateActivationToken(token);
    
    if (!result.valid) {
      return res.status(400).json({ valid: false, error: result.error });
    }

    res.json({ valid: true });
  } catch (error) {
    next(error);
  }
});

const activateSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(1)
});

authRouter.post('/activate', async (req, res, next) => {
  try {
    const payload = activateSchema.parse(req.body);
    const result = await activateUserWithPassword(payload.token, payload.password, payload.confirmPassword);
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: 'Account activated successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
});

// Resend activation email (admin only)
authRouter.post('/activate/resend', requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await sendUserActivationEmail(userId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, message: 'Activation email sent successfully' });
  } catch (error) {
    next(error);
  }
});
