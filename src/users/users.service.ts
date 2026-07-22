import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { Prisma } from '../generated/prisma/client.js';
import { AuthRepository } from '../auth/auth.repository.js';
import type { ChangePasswordDto, CreateUserDto, ListUsersDto, UpdateMeDto, UpdateUserDto } from './users.schemas.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly sessions: AuthRepository,
  ) {}
  async get(id: string) {
    const user = await this.repo.find(id);
    if (!user || user.status === 'DELETED') throw new NotFoundException('User not found');
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
  async updateMe(id: string, dto: UpdateMeDto) {
    await this.get(id);
    return this.repo.update(id, dto);
  }
  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.repo.find(id);
    if (!user || user.status !== 'ACTIVE') throw new NotFoundException('User not found');
    if (!(await argon2.verify(user.passwordHash, dto.currentPassword)))
      throw new UnauthorizedException({ message: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD' });
    await this.repo.update(id, { passwordHash: await argon2.hash(dto.newPassword, { type: argon2.argon2id }) });
    await this.sessions.revokeAll(id);
  }
  async list(dto: ListUsersDto) {
    const [data, total] = await this.repo.list({
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      ...(dto.search && { search: dto.search }),
      ...(dto.role && { role: dto.role }),
      ...(dto.status && { status: dto.status }),
    });
    return { data, pagination: { page: dto.page, limit: dto.limit, total, pages: Math.ceil(total / dto.limit) } };
  }
  async create(dto: CreateUserDto) {
    return this.repo.create({
      email: dto.email,
      displayName: dto.displayName,
      role: dto.role,
      passwordHash: await argon2.hash(dto.password, { type: argon2.argon2id }),
    });
  }
  async update(actorId: string, targetId: string, dto: UpdateUserDto) {
    return this.protectedUpdate(actorId, targetId, dto);
  }
  async remove(actorId: string, targetId: string): Promise<void> {
    await this.protectedUpdate(actorId, targetId, { status: 'DELETED', deletedAt: new Date() });
  }
  private async protectedUpdate(actorId: string, targetId: string, data: Prisma.UserUpdateInput) {
    const result = await this.repo.adminSensitiveUpdate(actorId, targetId, data);
    if (result.kind === 'missing') throw new NotFoundException('User not found');
    if (result.kind === 'self')
      throw new ForbiddenException({
        message: 'Administrators cannot demote, deactivate, or delete themselves',
        code: 'ADMIN_SELF_PROTECTION',
      });
    if (result.kind === 'last')
      throw new ConflictException({ message: 'The last active administrator cannot be removed', code: 'LAST_ADMIN' });
    return result.user;
  }
}
