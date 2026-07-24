import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, Public } from '../common/decorators.js';
import type { Principal } from '../common/types.js';
import { AuthService } from './auth.service.js';
import { LoginDto, RefreshDto, RegisterDto, TokenPairDto } from './auth.schemas.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('register')
  @ApiCreatedResponse({ type: TokenPairDto })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Public()
  @HttpCode(200)
  @Post('login')
  @ApiOkResponse({ type: TokenPairDto })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
  @Public() @HttpCode(200) @Post('refresh') @ApiOkResponse({ type: TokenPairDto }) refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }
  @Public() @HttpCode(204) @Post('logout') logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto);
  }
  @ApiBearerAuth() @HttpCode(204) @Post('logout-all') logoutAll(@CurrentUser() user: Principal) {
    return this.auth.logoutAll(user.sub);
  }
}
