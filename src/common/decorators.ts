import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Principal } from './types.js';
import type { Request } from 'express';

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
export const ROLES = 'roles';
export const Roles = (...roles: Array<'USER' | 'ADMIN'>) => SetMetadata(ROLES, roles);
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Principal => ctx.switchToHttp().getRequest<Request>().user!,
);
