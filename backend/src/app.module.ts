import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MenuModule } from './modules/menu/menu.module';
import { RoleModule } from './modules/role/role.module';
import { LogModule } from './modules/log/log.module';
import { HealthModule } from './modules/health/health.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { CacheModule } from './modules/cache/cache.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
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
    
    // 数据库连接
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // 暂时禁用自动同步以避免数据库错误
      synchronize: false,
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
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
