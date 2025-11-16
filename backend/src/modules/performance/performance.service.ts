import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { CreatePerformanceMetricDto, QueryPerformanceDto } from './dto/performance.dto';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(PerformanceMetric)
    private performanceRepository: Repository<PerformanceMetric>,
  ) {}

  // 创建性能记录
  async create(data: CreatePerformanceMetricDto): Promise<PerformanceMetric> {
    const metric = this.performanceRepository.create(data);
    return this.performanceRepository.save(metric);
  }

  // 查询性能记录列表
  async findAll(query: QueryPerformanceDto) {
    const { page = 1, pageSize = 10, method, path, minResponseTime, startDate, endDate } = query;

    const queryBuilder = this.performanceRepository.createQueryBuilder('metric');

    if (method) {
      queryBuilder.andWhere('metric.method = :method', { method });
    }

    if (path) {
      queryBuilder.andWhere('metric.path LIKE :path', { path: `%${path}%` });
    }

    if (minResponseTime) {
      queryBuilder.andWhere('metric.responseTime >= :minResponseTime', { minResponseTime });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('metric.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('metric.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('metric.createdAt <= :endDate', { endDate });
    }

    queryBuilder.orderBy('metric.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取性能统计数据
  async getStats(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.performanceRepository.createQueryBuilder('metric');

    if (startDate && endDate) {
      queryBuilder.where('metric.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const stats = await queryBuilder
      .select('AVG(metric.responseTime)', 'avgResponseTime')
      .addSelect('MAX(metric.responseTime)', 'maxResponseTime')
      .addSelect('MIN(metric.responseTime)', 'minResponseTime')
      .addSelect('COUNT(*)', 'totalRequests')
      .addSelect('SUM(CASE WHEN metric.statusCode >= 400 THEN 1 ELSE 0 END)', 'errorCount')
      .getRawOne();

    // 状态码分布
    const statusCodeDistribution = await queryBuilder
      .select('metric.statusCode', 'statusCode')
      .addSelect('COUNT(*)', 'count')
      .groupBy('metric.statusCode')
      .getRawMany();

    // Top 10 慢接口
    const slowEndpoints = await this.performanceRepository
      .createQueryBuilder('metric')
      .select('metric.method', 'method')
      .addSelect('metric.path', 'path')
      .addSelect('AVG(metric.responseTime)', 'avgResponseTime')
      .addSelect('COUNT(*)', 'count')
      .groupBy('metric.method, metric.path')
      .orderBy('avgResponseTime', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      ...stats,
      avgResponseTime: parseFloat(stats.avgResponseTime || 0).toFixed(2),
      maxResponseTime: parseInt(stats.maxResponseTime || 0),
      minResponseTime: parseInt(stats.minResponseTime || 0),
      totalRequests: parseInt(stats.totalRequests || 0),
      errorCount: parseInt(stats.errorCount || 0),
      errorRate: stats.totalRequests > 0
        ? ((stats.errorCount / stats.totalRequests) * 100).toFixed(2)
        : '0.00',
      statusCodeDistribution,
      slowEndpoints: slowEndpoints.map(item => ({
        ...item,
        avgResponseTime: parseFloat(item.avgResponseTime).toFixed(2),
        count: parseInt(item.count),
      })),
    };
  }

  // 获取时间序列数据
  async getTimeSeries(hours: number = 24) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const data = await this.performanceRepository
      .createQueryBuilder('metric')
      .select("DATE_FORMAT(metric.createdAt, '%Y-%m-%d %H:00:00')", 'time')
      .addSelect('AVG(metric.responseTime)', 'avgResponseTime')
      .addSelect('COUNT(*)', 'requestCount')
      .addSelect('SUM(CASE WHEN metric.statusCode >= 400 THEN 1 ELSE 0 END)', 'errorCount')
      .where('metric.createdAt >= :startDate', { startDate })
      .groupBy('time')
      .orderBy('time', 'ASC')
      .getRawMany();

    return data.map(item => ({
      time: item.time,
      avgResponseTime: parseFloat(item.avgResponseTime || 0).toFixed(2),
      requestCount: parseInt(item.requestCount || 0),
      errorCount: parseInt(item.errorCount || 0),
    }));
  }

  // 清理旧数据
  async cleanup(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.performanceRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected;
  }
}
