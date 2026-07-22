CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'DELETED');
CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "email" VARCHAR(320) NOT NULL,
  "displayName" VARCHAR(100) NOT NULL, "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER', "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3), CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RefreshSession" (
  "id" UUID NOT NULL, "userId" UUID NOT NULL, "tokenHash" CHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3), "replacedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProfileImage" (
  "userId" UUID NOT NULL, "objectKey" TEXT NOT NULL, "mimeType" VARCHAR(30) NOT NULL,
  "size" INTEGER NOT NULL, "etag" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfileImage_pkey" PRIMARY KEY ("userId")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_status_role_idx" ON "User"("status", "role");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE INDEX "RefreshSession_userId_revokedAt_idx" ON "RefreshSession"("userId", "revokedAt");
CREATE UNIQUE INDEX "ProfileImage_objectKey_key" ON "ProfileImage"("objectKey");
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileImage" ADD CONSTRAINT "ProfileImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
