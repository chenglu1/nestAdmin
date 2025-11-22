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

  // 安全的JSON序列化方法，避免循环引用
  private safeStringify(obj: any): string {
    try {
      // 简单类型直接返回
      if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
      }

      const seen = new WeakSet();
      
      // 常见可能导致循环引用的构造函数名称列表
      const problematicConstructors = [
        'Socket', 'ServerResponse', 'IncomingMessage', 'HTTPParser', 
        'Buffer', 'Stream', 'EventEmitter', 'TCP', 'TLSSocket',
        'ReadableStream', 'WritableStream', 'TransformStream',
        'http.ClientRequest', 'http.IncomingMessage', 'http.ServerResponse'
      ];
      
      // 更安全的序列化函数，处理循环引用并跳过复杂对象
      const replacer = (_key: string, value: any): any => {
        // 处理循环引用
        if (typeof value === 'object' && value !== null) {
          // 检查是否已经见过这个对象 - 首要检查，防止循环引用
          if (seen.has(value)) {
            return '[Circular]';
          }
          
          try {
            // 尝试添加到已见集合（某些特殊对象可能无法添加到WeakSet）
            seen.add(value);
          } catch (e) {
            // 如果无法添加到WeakSet，很可能是特殊对象，直接返回占位符
            return '[ComplexObject]';
          }
          
          // 检查构造函数名称
          const constructorName = value.constructor?.name;
          
          // 快速检查：跳过已知的问题构造函数类型
          if (constructorName && problematicConstructors.includes(constructorName)) {
            return `[${constructorName}]`;
          }
          
          // 特殊类型检查
          if (value instanceof Buffer || 
              value instanceof Date || 
              value instanceof Error ||
              value instanceof Map ||
              value instanceof Set) {
            return constructorName ? `[${constructorName}]` : '[Object]';
          }
          
          // 功能性检查：流、事件发射器等
          if (typeof value.pipe === 'function' ||
              (typeof value.on === 'function' && typeof value.emit === 'function') ||
              typeof value.listen === 'function' ||
              typeof value.connect === 'function') {
            return constructorName ? `[${constructorName}]` : '[FunctionalObject]';
          }
          
          // 可疑属性检查：更全面地检查可能导致循环引用的属性
          const suspiciousProps = ['socket', 'parser', 'req', 'res', 'connection', 
                                 'parent', 'child', '_events', '_eventsCount', 
                                 '_maxListeners', 'httpVersion', 'headers', 
                                 'rawHeaders', 'trailers', 'rawTrailers',
                                 'aborted', 'upgrade', 'url', 'method',
                                 'statusCode', 'statusMessage', '_httpMessage'];
          
          // 检查是否包含可疑属性
          for (const prop of suspiciousProps) {
            if (prop in value) {
              // 如果包含可疑属性，进一步检查该属性是否是对象且可能形成循环
              const propValue = value[prop];
              if (propValue && typeof propValue === 'object' && 
                  (propValue.constructor?.name && problematicConstructors.includes(propValue.constructor.name))) {
                return `[${constructorName || 'Object'}]`;
              }
            }
          }
        }
        
        // 对于非对象类型或安全的对象，直接返回
        return value;
      };

      // 执行安全的JSON序列化
      const result = JSON.stringify(obj, replacer);
      return result;
    } catch (e) {
        // 如果序列化失败，返回更详细的错误信息但避免暴露敏感数据
        const errorMessage = e instanceof Error ? e.message : String(e);
        this.logger.debug(`JSON序列化失败: ${errorMessage}`);
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
