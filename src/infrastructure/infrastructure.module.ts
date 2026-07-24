import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { RedisService } from './redis.service.js';
import { StorageService } from './storage.service.js';
import { ThrottlerStorageService } from './throttler-storage.service.js';

@Global()
@Module({
  providers: [PrismaService, RedisService, StorageService, ThrottlerStorageService],
  exports: [PrismaService, RedisService, StorageService, ThrottlerStorageService],
})
export class InfrastructureModule {}
