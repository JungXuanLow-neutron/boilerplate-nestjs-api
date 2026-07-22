import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import type { Request, Response } from 'express';

@Injectable()
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let detail = 'An unexpected error occurred';
    let errors: Array<{ pointer: string; detail: string; code: string }> | undefined;
    const nestedZodError = exception instanceof ZodValidationException ? exception.getZodError() : exception;
    if (nestedZodError instanceof ZodError) {
      status = 400;
      code = 'VALIDATION_ERROR';
      detail = 'Request validation failed';
      errors = nestedZodError.issues.map((i) => ({
        pointer: `/${i.path.join('/')}`,
        detail: i.message,
        code: i.code,
      }));
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = 409;
        code = 'CONFLICT';
        detail = 'A record with that value already exists';
      } else if (exception.code === 'P2025') {
        status = 404;
        code = 'NOT_FOUND';
        detail = 'The requested resource was not found';
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: string | string[]; code?: string });
      const message = typeof raw === 'string' ? raw : raw.message;
      detail = Array.isArray(message) ? message.join('; ') : (message ?? exception.message);
      code = typeof raw === 'object' && raw.code ? raw.code : this.codeFor(status);
    }
    if (Number(status) >= 500) this.logger.error({ requestId: req.id, exception }, 'Request failed');
    const title = HttpStatus[status]?.replaceAll('_', ' ') ?? 'Error';
    res
      .status(status)
      .type('application/problem+json')
      .json({
        type: `https://timesheet.local/problems/${code.toLowerCase().replaceAll('_', '-')}`,
        title,
        status,
        detail,
        instance: req.originalUrl,
        code,
        requestId: req.id,
        ...(errors && { errors }),
      });
  }
  private codeFor(status: number): string {
    return (
      (
        {
          400: 'BAD_REQUEST',
          401: 'UNAUTHORIZED',
          403: 'FORBIDDEN',
          404: 'NOT_FOUND',
          409: 'CONFLICT',
          413: 'PAYLOAD_TOO_LARGE',
          429: 'RATE_LIMITED',
          503: 'DEPENDENCY_UNAVAILABLE',
        } as Record<number, string>
      )[status] ?? 'INTERNAL_ERROR'
    );
  }
}
