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

  // 安全的JSON序列化方法，避免循环引用
  private safeStringify(obj: any): string {
    try {
      // 简单类型直接返回
      if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
      }

      const seen = new WeakSet();
      
      // 更安全的序列化函数，处理循环引用并跳过复杂对象
      const replacer = (_key: string, value: any): any => {
        // 处理循环引用
        if (typeof value === 'object' && value !== null) {
          // 检查是否已经见过这个对象
          if (seen.has(value)) {
            return '[Circular]';
          }
          
          // 添加到已见集合
          seen.add(value);
          
          // 跳过可能包含循环引用的复杂对象类型
          if (value instanceof Buffer || 
              value instanceof Date || 
              value instanceof Error ||
              value.constructor?.name === 'Socket' ||
              value.constructor?.name === 'ServerResponse' ||
              value.constructor?.name === 'IncomingMessage' ||
              value.constructor?.name === 'HTTPParser' ||
              typeof value.pipe === 'function' ||
              typeof value.on === 'function' && typeof value.emit === 'function') {
            return `[${value.constructor?.name || 'Object'}]`;
          }
        }
        return value;
      };

      const result = JSON.stringify(obj, replacer);
      return result;
    } catch (e) {
      // 如果序列化失败，返回空字符串或基本信息
      return `[无法序列化: ${typeof obj}]`;
    }
  }

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
          this.safeStringify(data).length,
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
      requestSize: this.safeStringify(requestData).length,
      responseSize,
      ipAddress: getClientIp(request),
      userAgent: request.headers?.['user-agent'] || '',
      // 修复用户属性访问，支持JWT默认的sub和username
      userId: user?.userId || user?.id || (user?.sub && typeof user.sub === 'number' ? user.sub : (user?.sub && typeof user.sub === 'string' ? parseInt(user.sub, 10) : undefined)),
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
