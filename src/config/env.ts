import { z } from 'zod';

const bool = (fallback: 'true' | 'false') =>
  z.preprocess(
    (value) => value ?? fallback,
    z.enum(['true', 'false']).transform((value) => value === 'true'),
  );
const duration = z.string().regex(/^\d+[smhd]$/);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  MINIO_ENDPOINT: z.string().url(),
  MINIO_REGION: z.string().default('us-east-1'),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(8),
  MINIO_BUCKET: z.string().min(3).default('profile-images'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: duration.default('15m'),
  JWT_REFRESH_TTL: duration.default('7d'),
  CORS_ORIGINS: z.string().default(''),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DOCS_ENABLED: bool('true'),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
  SEED_ADMIN_DISPLAY_NAME: z.string().min(1).max(100).optional(),
});

export type Env = z.infer<typeof envSchema>;
export const validateEnv = (input: Record<string, unknown>): Env => envSchema.parse(input);
