import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MenuModule } from './modules/menu/menu.module';
import { RoleModule } from './modules/role/role.module';
import { LogModule } from './modules/log/log.module';
import { HealthModule } from './modules/health/health.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { CacheModule } from './modules/cache/cache.module';
import { ChatanywhereModule } from './modules/chatanywhere/chatanywhere.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { winstonConfig } from './config/winston.config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Winston 日志模块
    WinstonModule.forRoot(winstonConfig),
    
    // 缓存模块
    CacheModule,
    
    // HTTP模块，用于外部API调用
    HttpModule,
    
    // 请求限流模块
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (_configService: ConfigService) => {
        return {
          // 默认限流配置：100次请求/60秒
          throttlers: [
            {
              ttl: 60000, // 时间窗口：60秒
              limit: 100, // 限制：100次请求
            },
          ],
          // 注意：Redis 存储需要额外配置，当前使用内存存储
          // 如需分布式限流，可配置 Redis storage
        };
      },
    }),
    
    // 数据库连接
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      // 优化日志输出
      logging: process.env.NODE_ENV === 'development' ? true : ['error', 'warn'],
      // 连接池配置
      extra: {
        connectionLimit: 10, // 连接池大小
        waitForConnections: true,
        queueLimit: 0,
      },
      // 连接超时
      connectTimeout: 10000,
      // 查询超时
      maxQueryExecutionTime: 2000, // 超过2秒的查询会被记录
      // 字符集
      charset: 'utf8mb4',
      timezone: '+08:00',
      // 自动重连
      autoLoadEntities: true,
    }),
    
    AuthModule,
    UserModule,
    MenuModule,
    RoleModule,
    LogModule,
    HealthModule,
    PerformanceModule,
    ChatanywhereModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor, // 请求ID拦截器（最先执行）
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    // 全局启用请求限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
