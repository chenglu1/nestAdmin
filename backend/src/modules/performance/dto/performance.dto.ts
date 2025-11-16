import { IsOptional, IsString, IsInt, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPerformanceDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: 'HTTP 方法' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: '请求路径' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: '最小响应时间(ms)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minResponseTime?: number;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class CreatePerformanceMetricDto {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize?: number;
  responseSize?: number;
  ipAddress?: string;
  userAgent?: string;
  userId?: number;
  username?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  errorMessage?: string;
}
