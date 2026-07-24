import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { ThrottlerStorageService } from '../src/infrastructure/throttler-storage.service.js';

describe('Rate limiting dependency failures', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.TRUST_PROXY = 'true';
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ThrottlerStorageService)
      .useValue({
        increment: () => Promise.reject(new Error('redis unavailable')),
      })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns dependency unavailable problem details when throttling storage fails', async () => {
    const requestId = randomUUID();
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('x-forwarded-for', '198.51.100.26')
      .set('x-request-id', requestId)
      .expect(503);

    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.headers['x-request-id']).toBe(requestId);
    expect(response.body).toMatchObject({
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      detail: 'Rate limiting dependency is unavailable',
      requestId,
    });
  });
});
