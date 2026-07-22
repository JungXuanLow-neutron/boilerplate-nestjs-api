import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { RedisService } from '../infrastructure/redis.service.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const authAttempt = req.method === 'POST' && ['/api/v1/auth/login', '/api/v1/auth/register'].includes(req.path);
    const limit = authAttempt ? 5 : 100;
    const scope = authAttempt ? 'auth' : 'global';
    const key = `rate:${scope}:${req.ip ?? req.socket.remoteAddress ?? 'unknown'}:${Math.floor(Date.now() / 60000)}`;
    try {
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, 61);
      if (count > limit) throw new HttpException('Rate limit exceeded', 429);
    } catch (error) {
      if (error instanceof HttpException) throw error; /* fail open if Redis is unavailable */
    }
    return true;
  }
}
