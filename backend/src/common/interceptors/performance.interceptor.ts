import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PerformanceService } from '../../modules/performance/performance.service';
import { getClientIp } from '../utils/ip.util';

const SLOW_REQUEST_THRESHOLD = 1000; // 毫秒

interface PerformanceMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  ipAddress: string;
  userAgent: string;
  userId?: number;
  username?: string;
  cpuUsage?: number;
  memoryUsage?: number;
  errorMessage?: string;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(private performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, body, query, params } = request;
    const user = request.user;
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    return next.handle().pipe(
      tap((data) => {
        const metrics = this.buildMetrics(
          method,
          originalUrl,
          200,
          Date.now() - startTime,
          { body, query, params },
          JSON.stringify(data).length,
          request,
          user,
          startMemory,
          startCpu,
        );
        this.saveMetrics(metrics);
        this.checkSlowRequest(metrics);
      }),
      catchError((error) => {
        const metrics = this.buildMetrics(
          method,
          originalUrl,
          error.status || 500,
          Date.now() - startTime,
          { body, query, params },
          0,
          request,
          user,
          startMemory,
          startCpu,
          error.message,
        );
        this.saveMetrics(metrics);
        return throwError(() => error);
      }),
    );
  }

  /**
   * 构建性能指标
   */
  private buildMetrics(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    requestData: any,
    responseSize: number,
    request: any,
    user: any,
    startMemory: NodeJS.MemoryUsage,
    startCpu: NodeJS.CpuUsage,
    errorMessage?: string,
  ): PerformanceMetrics {
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(startCpu);

    return {
      method,
      path,
      statusCode,
      responseTime,
      requestSize: JSON.stringify(requestData).length,
      responseSize,
      ipAddress: getClientIp(request),
      userAgent: request.headers['user-agent'] || '',
      userId: user?.userId,
      username: user?.username,
      cpuUsage: parseFloat(
        ((endCpu.user + endCpu.system) / 1000).toFixed(2),
      ),
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      errorMessage,
    };
  }

  /**
   * 异步保存性能指标
   */
  private saveMetrics(metrics: PerformanceMetrics): void {
    this.performanceService.create(metrics).catch((error) => {
      this.logger.error('保存性能数据失败:', error);
    });
  }

  /**
   * 检查慢请求并告警
   */
  private checkSlowRequest(metrics: PerformanceMetrics): void {
    if (metrics.responseTime > SLOW_REQUEST_THRESHOLD) {
      this.logger.warn(
        `慢请求告警: ${metrics.method} ${metrics.path} - ${metrics.responseTime}ms`,
      );
    }
  }
}
