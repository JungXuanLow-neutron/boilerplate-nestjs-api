import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { RateLimitGuard } from './auth/rate-limit.guard.js';
import { ProblemDetailsFilter } from './common/problem.filter.js';
import { validateEnv } from './config/env.js';
import { HealthModule } from './health/health.module.js';
import { InfrastructureModule } from './infrastructure/infrastructure.module.js';
import { ThrottlerStorageService } from './infrastructure/throttler-storage.service.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    InfrastructureModule,
    ThrottlerModule.forRootAsync({
      imports: [InfrastructureModule],
      inject: [ThrottlerStorageService],
      useFactory: (storage: ThrottlerStorageService) => ({
        errorMessage: 'Rate limit exceeded',
        storage,
        throttlers: [{ name: 'default', ttl: 60000, limit: 100 }],
      }),
    }),
    AuthModule,
    UsersModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule {}
