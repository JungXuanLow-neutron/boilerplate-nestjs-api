import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/infrastructure/prisma.service.js';
import { RedisService } from '../src/infrastructure/redis.service.js';

describe('API (real dependencies)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let redis: RedisService;
  let userId: string | undefined;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    process.env.TRUST_PROXY = 'true';
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(PrismaService);
    redis = app.get(RedisService);
    await redis.flushdb();
  });

  afterAll(async () => {
    if (userId) await db.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('reports all dependencies ready and publishes authenticated OpenAPI', async () => {
    const ready = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    expect(ready.body.dependencies).toEqual({ postgres: 'up', redis: 'up', minio: 'up' });
    const openapi = await request(app.getHttpServer()).get('/openapi.json').expect(200);
    expect(openapi.body.paths['/api/v1/auth/login']).toBeDefined();
    expect(openapi.body.components.securitySchemes.bearer).toBeDefined();
    const docs = await request(app.getHttpServer()).get('/docs').expect(200);
    const nonce = docs.text.match(/nonce="([^"]+)"/)?.[1];
    expect(nonce).toEqual(expect.any(String));
    expect(docs.headers['content-security-policy']).toContain(`'nonce-${nonce}'`);
    expect(docs.text).toMatch(/"agent":\s*\{\s*"disabled":\s*true/);
  });

  it('returns RFC problem details with Zod issue pointers', async () => {
    const requestId = randomUUID();
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('x-request-id', requestId)
      .send({})
      .expect(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.headers['x-request-id']).toBe(requestId);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    expect(response.body.requestId).toBe(requestId);
    expect(response.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ pointer: '/email' })]));
  });

  it('registers a user and authorizes self-service access', async () => {
    const email = `e2e-${randomUUID()}@example.com`;
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, displayName: 'E2E User', password: 'TestingPassword123!' })
      .expect(201);
    ({ accessToken, refreshToken } = registered.body);
    userId = registered.body.user.id;
    expect(registered.body.user.role).toBe('USER');
    const me = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(email);
    await request(app.getHttpServer()).get('/api/v1/users').set('authorization', `Bearer ${accessToken}`).expect(403);
  });

  it('rotates refresh tokens and contains reuse', async () => {
    const rotated = await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401)
      .expect(({ body }) => expect(body.code).toBe('REFRESH_TOKEN_REUSED'));
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });

  it('validates, stores, streams, and deletes a private avatar', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/users/${userId}/avatar`)
      .set('authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('not an image'), { filename: 'fake.png', contentType: 'image/png' })
      .expect(400);
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    await request(app.getHttpServer())
      .put(`/api/v1/users/${userId}/avatar`)
      .set('authorization', `Bearer ${accessToken}`)
      .attach('file', pngSignature, { filename: 'avatar.png', contentType: 'image/png' })
      .expect(200);
    const downloaded = await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}/avatar`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect('content-type', /image\/png/)
      .expect(200);
    expect(downloaded.body).toEqual(pngSignature);
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${userId}/avatar`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(204);
  });

  it('rate limits repeated auth attempts with RFC problem details', async () => {
    await redis.flushdb();
    const forwardedIp = '198.51.100.24';

    for (let index = 0; index < 5; index += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('x-forwarded-for', forwardedIp)
        .send({})
        .expect(400);
    }

    const rateLimited = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('x-forwarded-for', forwardedIp)
      .send({})
      .expect(429);

    expect(rateLimited.headers['content-type']).toContain('application/problem+json');
    expect(rateLimited.body).toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
      detail: 'Rate limit exceeded',
    });
    expect(rateLimited.body.requestId).toEqual(expect.any(String));
  });

  it('rate limits repeated non-auth requests with RFC problem details', async () => {
    await redis.flushdb();
    const forwardedIp = '198.51.100.25';

    for (let index = 0; index < 100; index += 1) {
      await request(app.getHttpServer()).get('/api/v1/health/live').set('x-forwarded-for', forwardedIp).expect(200);
    }

    const rateLimited = await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .set('x-forwarded-for', forwardedIp)
      .expect(429);

    expect(rateLimited.headers['content-type']).toContain('application/problem+json');
    expect(rateLimited.body).toMatchObject({
      status: 429,
      code: 'RATE_LIMITED',
      detail: 'Rate limit exceeded',
    });
  });
});
