import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { RateLimitGuard } from './rate-limit.guard.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthGuard, RateLimitGuard],
  exports: [AuthService, AuthRepository, AuthGuard, RateLimitGuard],
})
export class AuthModule {}
