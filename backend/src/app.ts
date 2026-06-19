import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './common/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { serviceRequestRouter } from './modules/serviceRequests/serviceRequest.routes.js';
import { genericModuleRouter } from './modules/generic/generic.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { importRouter } from './modules/import/import.routes.js';
import { rolesRouter } from './modules/roles/roles.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(pinoHttp({ logger }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'saven-infraops-api' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/service-requests', serviceRequestRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/import', importRouter);
  app.use('/api/roles', rolesRouter);
  app.use('/api', genericModuleRouter);

  app.use(errorHandler);
  return app;
}
