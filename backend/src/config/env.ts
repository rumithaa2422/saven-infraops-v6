import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3001'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('8h'),
  AI_PROVIDER: z.enum(['mock', 'openai', 'claude', 'private']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  CLAUDE_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-3-5-sonnet-latest'),
  PRIVATE_AI_BASE_URL: z.string().optional(),
  PRIVATE_AI_API_KEY: z.string().optional(),
  PRIVATE_AI_MODEL: z.string().default('saven-private-model'),
  EMAIL_ENABLED: z.coerce.boolean().default(false),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Saven InfraOps <infraops@saven.in>'),
  TEAMS_ENABLED: z.coerce.boolean().default(false),
  TEAMS_WEBHOOK_URL: z.string().optional(),
  EXCEL_MAX_FILE_SIZE_MB: z.coerce.number().default(20),
  AUDIT_ENABLED: z.coerce.boolean().default(true)
});

export const env = envSchema.parse(process.env);
