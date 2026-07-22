import type { Request, Response } from 'express';
import { pinoHttp } from 'pino-http';
import type { HttpLogger } from 'pino-http';
import type { Env } from '../../config/env.js';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.refreshToken',
];

export function createRequestLoggerMiddleware(level: Env['LOG_LEVEL']): HttpLogger<Request, Response> {
  return pinoHttp<Request, Response>({
    level,
    redact: REDACT_PATHS,
    genReqId: (req: Request) => req.id,
  });
}
