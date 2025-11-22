import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
// 修复循环引用问题
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

  /**
   * 安全的JSON序列化方法 - 简单粗暴的实现
   */
  private safeStringify(obj: any): string {
    // 简单粗暴的方法：直接尝试JSON序列化，如果失败则返回简化信息
    try {
      // 首先尝试直接序列化，如果成功最好
      return JSON.stringify(obj);
    } catch (error) {
      // 序列化失败，可能是循环引用导致的
      try {
        // 方法1: 使用replacer函数处理常见的循环引用情况
        return JSON.stringify(obj, (key, val) => {
          // 跳过常见的问题属性
          if (key && ['_events', '_eventsCount', '_maxListeners', 'socket', 'parser', 'res', 'req', 
                     'buffer', 'stack', '__proto__', 'constructor'].includes(key)) {
            return '[Skipped]';
          }
          // 处理常见的问题对象类型
          if (val && typeof val === 'object') {
            const constructorName = val.constructor?.name;
            if (['Socket', 'HTTPParser', 'ServerResponse', 'IncomingMessage', 
                 'Stream', 'Buffer', 'EventEmitter', 'Function'].includes(constructorName)) {
              return `[${constructorName}]`;
            }
            // 尝试限制对象深度，避免复杂嵌套
            if (constructorName === 'Object' || constructorName === 'Array') {
              // 对于普通对象和数组，尝试简化表示
              if (key && key.length > 30) return '[LongKey]';
              
              // 对于数组，只保留前10个元素
              if (Array.isArray(val) && val.length > 10) {
                return `[Array(${val.length})]`;
              }
              
              // 对于普通对象，只保留有限的键
              if (!Array.isArray(val) && Object.keys(val).length > 10) {
                return `[Object(${Object.keys(val).length} keys)]`;
              }
            }
          }
          return val;
        });
      } catch (e) {
        // 如果replacer方法也失败，返回最简化的信息
        try {
          // 最简化的处理：仅返回对象的基本类型信息
          return JSON.stringify({
            type: typeof obj,
            constructor: obj?.constructor?.name || 'Unknown',
            simplified: true,
            message: 'Object contained circular references or unstringifiable values'
          });
        } catch (finalError) {
          // 终极兜底：如果所有方法都失败，返回一个完全静态的字符串
          return '{"error":"Serialization failed completely"}';
        }
      }
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
