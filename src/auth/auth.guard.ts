import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Env } from '../config/env.js';
import { IS_PUBLIC, ROLES } from '../common/decorators.js';
import { PrismaService } from '../infrastructure/prisma.service.js';
import type { Principal } from '../common/types.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly db: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token required');
    let payload: Principal & { typ?: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }) });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    if (payload.typ !== 'access') throw new UnauthorizedException('Invalid access token');
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');
    req.user = { sub: user.id, role: user.role, jti: payload.jti };
    const roles = this.reflector.getAllAndOverride<Array<'USER' | 'ADMIN'>>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles && !roles.includes(user.role)) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
