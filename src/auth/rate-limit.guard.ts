import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    storage: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storage, reflector);
  }

  async canActivate(context: Parameters<ThrottlerGuard['canActivate']>[0]): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      if (error instanceof ThrottlerException) throw error;
      throw new ServiceUnavailableException({
        message: 'Rate limiting dependency is unavailable',
        code: 'DEPENDENCY_UNAVAILABLE',
      });
    }
  }
}
