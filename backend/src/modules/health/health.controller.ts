import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '../../common/decorators/throttle.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @SkipThrottle() // 健康检查接口跳过限流
  @HealthCheck()
  @ApiOperation({ summary: '系统健康检查' })
  @ApiResponse({ status: 200, description: '系统健康' })
  check() {
    return this.health.check([
      // 数据库健康检查
      () => this.db.pingCheck('database'),
      
      // 内存检查 - 堆内存不超过 150MB
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // 内存检查 - RSS 不超过 150MB
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      
      // 磁盘检查 - 使用率不超过 90%
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: '数据库健康检查' })
  checkDatabase() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('memory')
  @HealthCheck()
  @ApiOperation({ summary: '内存健康检查' })
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  @Get('disk')
  @HealthCheck()
  @ApiOperation({ summary: '磁盘健康检查' })
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
