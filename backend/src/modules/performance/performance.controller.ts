import { Controller, Get, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PerformanceService } from './performance.service';
import { QueryPerformanceDto } from './dto/performance.dto';

@ApiTags('performance')
@ApiBearerAuth('JWT-auth')
@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('metrics')
  @ApiOperation({ summary: '获取性能记录列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMetrics(@Query() query: QueryPerformanceDto) {
    const result = await this.performanceService.findAll(query);
    return {
      code: 200,
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      message: '获取成功',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: '获取性能统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.performanceService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      code: 200,
      data: stats,
      message: '获取成功',
    };
  }

  @Get('timeseries')
  @ApiOperation({ summary: '获取时间序列数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTimeSeries(@Query('hours') hours?: string) {
    const data = await this.performanceService.getTimeSeries(
      hours ? parseInt(hours) : 24,
    );
    return {
      code: 200,
      data,
      message: '获取成功',
    };
  }

  @Delete('cleanup')
  @ApiOperation({ summary: '清理旧性能数据' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async cleanup(@Query('days') days?: string) {
    const affected = await this.performanceService.cleanup(
      days ? parseInt(days) : 30,
    );
    return {
      code: 200,
      data: { affected },
      message: `清理成功,删除了 ${affected} 条记录`,
    };
  }
}
