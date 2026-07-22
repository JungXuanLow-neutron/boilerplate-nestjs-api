import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import * as argon2 from 'argon2';
import { z } from 'zod';

const input = z
  .object({
    DATABASE_URL: z.string().url(),
    SEED_ADMIN_EMAIL: z.string().email(),
    SEED_ADMIN_PASSWORD: z.string().min(12),
    SEED_ADMIN_DISPLAY_NAME: z.string().min(1).max(100),
  })
  .parse(process.env);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: input.DATABASE_URL }) });
try {
  const email = input.SEED_ADMIN_EMAIL.trim().toLowerCase();
  await db.user.upsert({
    where: { email },
    update: {
      displayName: input.SEED_ADMIN_DISPLAY_NAME,
      passwordHash: await argon2.hash(input.SEED_ADMIN_PASSWORD, { type: argon2.argon2id }),
      role: 'ADMIN',
      status: 'ACTIVE',
      deletedAt: null,
    },
    create: {
      email,
      displayName: input.SEED_ADMIN_DISPLAY_NAME,
      passwordHash: await argon2.hash(input.SEED_ADMIN_PASSWORD, { type: argon2.argon2id }),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`Initial administrator is ready: ${email}`);
} finally {
  await db.$disconnect();
}
