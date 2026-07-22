import { describe, expect, it } from 'vitest';
import { envSchema } from './env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  MINIO_ENDPOINT: 'http://localhost:9000',
  MINIO_ACCESS_KEY: 'key',
  MINIO_SECRET_KEY: 'secret-key',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};
describe('environment validation', () => {
  it('normalizes defaults', () =>
    expect(envSchema.parse(valid)).toMatchObject({ PORT: 3000, DOCS_ENABLED: true, JWT_ACCESS_TTL: '15m' }));
  it('rejects short secrets', () => expect(() => envSchema.parse({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow());
});
