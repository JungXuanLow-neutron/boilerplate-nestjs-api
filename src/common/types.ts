import type { Role, UserStatus } from '../generated/prisma/client.js';

export type Principal = { sub: string; role: Role; jti: string };
export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: Principal;
    }
  }
}
