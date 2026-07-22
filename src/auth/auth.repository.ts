import { Injectable } from '@nestjs/common';
import type { Prisma, Role } from '../generated/prisma/client.js';
import { PrismaService } from '../infrastructure/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly db: PrismaService) {}
  findUserByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }
  findUser(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }
  createUser(data: { email: string; displayName: string; passwordHash: string; role?: Role }) {
    return this.db.user.create({ data });
  }
  createSession(data: Prisma.RefreshSessionUncheckedCreateInput) {
    return this.db.refreshSession.create({ data });
  }
  findSession(id: string) {
    return this.db.refreshSession.findUnique({ where: { id }, include: { user: true } });
  }
  rotateSession(oldId: string, data: Prisma.RefreshSessionUncheckedCreateInput) {
    return this.db.$transaction(async (tx) => {
      const old = await tx.refreshSession.findUnique({ where: { id: oldId } });
      if (!old || old.revokedAt) return null;
      const fresh = await tx.refreshSession.create({ data });
      await tx.refreshSession.update({ where: { id: oldId }, data: { revokedAt: new Date(), replacedById: fresh.id } });
      return fresh;
    });
  }
  revoke(id: string) {
    return this.db.refreshSession.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  revokeAll(userId: string) {
    return this.db.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
