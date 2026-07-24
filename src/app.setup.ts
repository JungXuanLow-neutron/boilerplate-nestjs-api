import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { INestApplication } from '@nestjs/common';
import type { Express, Request, Response } from 'express';
import helmet from 'helmet';
import { cleanupOpenApiDoc, ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { createRequestLoggerMiddleware } from './common/middleware/request-logger.middleware.js';
import type { Env } from './config/env.js';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Env, true>);
  const docsNonce = randomUUID().replaceAll('-', '');
  if (config.get('TRUST_PROXY', { infer: true })) {
    (app.getHttpAdapter().getInstance() as Express).set('trust proxy', true);
  }
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", `'nonce-${docsNonce}'`],
        },
      },
    }),
  );
  app.use(requestIdMiddleware);
  app.use(createRequestLoggerMiddleware(config.get('LOG_LEVEL', { infer: true })));
  const origins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : false, credentials: true });
  app.setGlobalPrefix('api/v1', { exclude: ['openapi.json', 'docs'] });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new ZodSerializerInterceptor(app.get(Reflector)));
  if (config.get('DOCS_ENABLED', { infer: true })) {
    const document = cleanupOpenApiDoc(
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle('boilerplate-nestjs')
          .setDescription('Authentication and user management API')
          .setVersion('1.0')
          .addBearerAuth()
          .build(),
      ),
    );
    app.getHttpAdapter().get('/openapi.json', (_req: Request, res: Response) => res.json(document));
    app.use('/docs', apiReference({ content: document, theme: 'purple', nonce: docsNonce, agent: { disabled: true } }));
  }
}
