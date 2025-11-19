import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST', 'localhost');
        const redisPort = configService.get('REDIS_PORT', 6379);
        const redisPassword = configService.get('REDIS_PASSWORD');
        const enableRedis = configService.get('ENABLE_REDIS', 'false') === 'true';

        if (!enableRedis) {
          // 不启用 Redis 时使用内存缓存
          return {
            ttl: 300, // 默认5分钟过期
            max: 100, // 最多缓存100个项目
          };
        }

        return {
          store: redisStore,
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          ttl: 300, // 默认5分钟过期
          max: 100,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
