import { Injectable } from '@nestjs/common';
import type { Prisma, Role, UserStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../infrastructure/prisma.service.js';

const publicSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;
@Injectable()
export class UsersRepository {
  constructor(private readonly db: PrismaService) {}
  find(id: string) {
    return this.db.user.findUnique({ where: { id }, select: { ...publicSelect, passwordHash: true, deletedAt: true } });
  }
  create(data: { email: string; displayName: string; passwordHash: string; role: Role }) {
    return this.db.user.create({ data, select: publicSelect });
  }
  update(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({ where: { id }, data, select: publicSelect });
  }
  list(input: { skip: number; take: number; search?: string; role?: Role; status?: UserStatus }) {
    const where: Prisma.UserWhereInput = {
      ...(input.role && { role: input.role }),
      ...(input.status && { status: input.status }),
      ...(input.search && {
        OR: [
          { email: { contains: input.search, mode: 'insensitive' } },
          { displayName: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    };
    return this.db.$transaction([
      this.db.user.findMany({
        where,
        select: publicSelect,
        skip: input.skip,
        take: input.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.user.count({ where }),
    ]);
  }
  async adminSensitiveUpdate(actorId: string, targetId: string, data: Prisma.UserUpdateInput) {
    return this.db.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({ where: { id: targetId } });
        if (!target) return { kind: 'missing' as const };
        const removesAdmin =
          target.role === 'ADMIN' &&
          (data.role === 'USER' || data.status === 'DEACTIVATED' || data.status === 'DELETED');
        if (actorId === targetId && removesAdmin) return { kind: 'self' as const };
        if (removesAdmin) {
          const count = await tx.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
          if (count <= 1) return { kind: 'last' as const };
        }
        const user = await tx.user.update({ where: { id: targetId }, data, select: publicSelect });
        if (data.status === 'DEACTIVATED' || data.status === 'DELETED')
          await tx.refreshSession.updateMany({
            where: { userId: targetId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        return { kind: 'ok' as const, user };
      },
      { isolationLevel: 'Serializable' },
    );
  }
  image(id: string) {
    return this.db.profileImage.findUnique({ where: { userId: id } });
  }
  upsertImage(userId: string, data: { objectKey: string; mimeType: string; size: number; etag?: string }) {
    return this.db.profileImage.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  }
  deleteImage(userId: string) {
    return this.db.profileImage.deleteMany({ where: { userId } });
  }
}
