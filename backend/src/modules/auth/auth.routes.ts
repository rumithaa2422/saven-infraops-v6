import { Router } from 'express';
import { z } from 'zod';
import { loginWithPassword } from './auth.service.js';
import { requireAuth } from '../../middleware/auth.js';

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
