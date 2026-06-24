import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Helper to properly coerce string "false" to boolean false
const coerceBool = (defaultValue: boolean) => {
  return z.preprocess(
    (val) => {
      if (val === true || val === 'true' || val === '1') return true;
      if (val === false || val === 'false' || val === '0' || val === '') return false;
      return defaultValue;
    },
    z.boolean()
  );
};

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3001'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('8h'),
  AI_PROVIDER: z.enum(['mock', 'openai', 'claude', 'gemini', 'private']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_TIMEOUT: z.coerce.number().default(30000),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  OPENAI_MAX_TOKENS: z.coerce.number().default(2000),
  CLAUDE_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-3-5-sonnet-latest'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  GEMINI_TIMEOUT: z.coerce.number().default(30000),
  GEMINI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  GEMINI_MAX_TOKENS: z.coerce.number().default(2048),
  PRIVATE_AI_BASE_URL: z.string().optional(),
  PRIVATE_AI_API_KEY: z.string().optional(),
  PRIVATE_AI_MODEL: z.string().default('saven-private-model'),
  EMAIL_ENABLED: coerceBool(false),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Saven InfraOps <infraops@saven.in>'),
  TEAMS_ENABLED: coerceBool(false),
  TEAMS_WEBHOOK_URL: z.string().optional(),
  EXCEL_MAX_FILE_SIZE_MB: z.coerce.number().default(20),
  AUDIT_ENABLED: coerceBool(true)
});

export const env = envSchema.parse(process.env);
