import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthGuard],
  exports: [AuthService, AuthRepository, AuthGuard],
})
export class AuthModule {}
