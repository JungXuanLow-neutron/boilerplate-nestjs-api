import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'node:crypto';
import type { Env } from '../config/env.js';
import type { PublicUser } from '../common/types.js';
import type { LoginDto, RefreshDto, RegisterDto } from './auth.schemas.js';
import { AuthRepository } from './auth.repository.js';

type TokenPayload = { sub: string; role: 'USER' | 'ADMIN'; jti: string; typ: 'access' | 'refresh' };
@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}
  async register(dto: RegisterDto) {
    const user = await this.repo.createUser({
      email: dto.email,
      displayName: dto.displayName,
      passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }),
    });
    return this.issue(user);
  }
  async login(dto: LoginDto) {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user || user.status !== 'ACTIVE' || !(await argon2.verify(user.passwordHash, dto.password)))
      throw new UnauthorizedException({ message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    return this.issue(user);
  }
  async refresh(dto: RefreshDto) {
    const payload = await this.verifyRefresh(dto.refreshToken);
    const session = await this.repo.findSession(payload.jti);
    const hash = this.hash(dto.refreshToken);
    if (!session) throw new UnauthorizedException({ message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    if (session.revokedAt || session.tokenHash !== hash) {
      await this.repo.revokeAll(session.userId);
      throw new UnauthorizedException({ message: 'Refresh token reuse detected', code: 'REFRESH_TOKEN_REUSED' });
    }
    if (session.expiresAt <= new Date() || session.user.status !== 'ACTIVE')
      throw new UnauthorizedException({ message: 'Refresh token is no longer valid', code: 'INVALID_REFRESH_TOKEN' });
    const tokens = await this.createTokens(session.user.id, session.user.role);
    const rotated = await this.repo.rotateSession(session.id, {
      id: tokens.jti,
      userId: session.user.id,
      tokenHash: this.hash(tokens.refreshToken),
      expiresAt: tokens.refreshExpires,
    });
    if (!rotated) {
      await this.repo.revokeAll(session.userId);
      throw new UnauthorizedException({ message: 'Refresh token reuse detected', code: 'REFRESH_TOKEN_REUSED' });
    }
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: this.publicUser(session.user) };
  }
  async logout(dto: RefreshDto): Promise<void> {
    try {
      const payload = await this.verifyRefresh(dto.refreshToken, true);
      await this.repo.revoke(payload.jti);
    } catch {
      /* deliberately idempotent */
    }
  }
  async logoutAll(userId: string): Promise<void> {
    await this.repo.revokeAll(userId);
  }
  private async issue(user: Parameters<AuthService['publicUser']>[0]) {
    const tokens = await this.createTokens(user.id, user.role);
    await this.repo.createSession({
      id: tokens.jti,
      userId: user.id,
      tokenHash: this.hash(tokens.refreshToken),
      expiresAt: tokens.refreshExpires,
    });
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: this.publicUser(user) };
  }
  private async createTokens(sub: string, role: 'USER' | 'ADMIN') {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();
    const accessToken = await this.jwt.signAsync(
      { sub, role, jti: accessJti, typ: 'access' },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
    );
    const refreshTtl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    const refreshToken = await this.jwt.signAsync(
      { sub, role, jti: refreshJti, typ: 'refresh' },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: refreshTtl as JwtSignOptions['expiresIn'],
      },
    );
    const seconds = this.durationSeconds(refreshTtl);
    return { accessToken, refreshToken, jti: refreshJti, refreshExpires: new Date(Date.now() + seconds * 1000) };
  }
  private async verifyRefresh(token: string, ignoreExpiration = false): Promise<TokenPayload> {
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        ignoreExpiration,
      });
      if (payload.typ !== 'refresh') throw new Error('wrong token type');
      return payload;
    } catch {
      throw new UnauthorizedException({ message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }
  }
  private hash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
  private durationSeconds(value: string) {
    const n = Number(value.slice(0, -1));
    return n * ({ s: 1, m: 60, h: 3600, d: 86400 }[value.at(-1)!] ?? 0);
  }
  private publicUser(user: {
    id: string;
    email: string;
    displayName: string;
    role: 'USER' | 'ADMIN';
    status: 'ACTIVE' | 'DEACTIVATED' | 'DELETED';
    createdAt: Date;
    updatedAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
