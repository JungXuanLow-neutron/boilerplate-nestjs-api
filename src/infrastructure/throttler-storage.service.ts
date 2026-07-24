import { Injectable } from '@nestjs/common';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisService } from './redis.service.js';

@Injectable()
export class ThrottlerStorageService extends ThrottlerStorageRedisService {
  constructor(redis: RedisService) {
    super(redis);
  }
}
