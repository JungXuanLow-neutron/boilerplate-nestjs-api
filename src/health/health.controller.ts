import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators.js';
import { PrismaService } from '../infrastructure/prisma.service.js';
import { RedisService } from '../infrastructure/redis.service.js';
import { StorageService } from '../infrastructure/storage.service.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: PrismaService,
    private readonly redis: RedisService,
    private readonly storage: StorageService,
  ) {}
  @Get('live') live() {
    return { status: 'ok' };
  }
  @Get('ready') async ready() {
    const checks = await Promise.allSettled([this.db.$queryRaw`SELECT 1`, this.redis.ping(), this.storage.ready()]);
    const dependencies = {
      postgres: checks[0]?.status === 'fulfilled' ? 'up' : 'down',
      redis: checks[1]?.status === 'fulfilled' ? 'up' : 'down',
      minio: checks[2]?.status === 'fulfilled' ? 'up' : 'down',
    };
    if (Object.values(dependencies).includes('down'))
      throw new ServiceUnavailableException({
        message: 'One or more dependencies are unavailable',
        code: 'DEPENDENCY_UNAVAILABLE',
        dependencies,
      });
    return { status: 'ok', dependencies };
  }
}
