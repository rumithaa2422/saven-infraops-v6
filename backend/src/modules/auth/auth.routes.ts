import { Router } from 'express';
import { z } from 'zod';
import { loginWithPassword } from './auth.service.js';
import { requireAuth } from '../../middleware/auth.js';
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
