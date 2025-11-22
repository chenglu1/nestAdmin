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

      // 使用Map而不是WeakSet，因为某些对象可能无法添加到WeakSet
      const seen = new Map<object, string>();
      let circularCount = 0;
      
      // 常见可能导致循环引用的构造函数名称列表
      const problematicConstructors = [
        'Socket', 'ServerResponse', 'IncomingMessage', 'HTTPParser', 
        'Buffer', 'Stream', 'EventEmitter', 'TCP', 'TLSSocket',
        'ReadableStream', 'WritableStream', 'TransformStream',
        'http.ClientRequest', 'http.IncomingMessage', 'http.ServerResponse',
        'SocketAddress', 'SecureContext', 'X509Certificate'
      ];
      
      // 可疑属性列表，这些属性通常包含循环引用
      const suspiciousProps = [
        'socket', 'parser', 'req', 'res', 'connection', 
        'parent', 'child', '_events', '_eventsCount', 
        '_maxListeners', 'httpVersion', 'headers', 
        'rawHeaders', 'trailers', 'rawTrailers',
        'aborted', 'upgrade', 'url', 'method',
        'statusCode', 'statusMessage', '_httpMessage',
        'client', 'server', 'context', 'session',
        '_body', 'request', 'response', 'handler',
        '_parsedUrl', 'originalUrl', 'baseUrl', 'route',
        'subdomains', 'params', 'query', 'cookies',
        'signedCookies', 'headersSent', 'locals',
        '_eventsLayer', 'next', 'prev', 'routes'
      ];
      
      // 递归处理对象的辅助函数
      const processObject = (value: any, path: string[] = []): any => {
        // 基本类型处理
        if (value === null || typeof value !== 'object') {
          return value;
        }
        
        // 检查是否已经处理过这个对象
        if (seen.has(value)) {
          circularCount++;
          return `[Circular:${seen.get(value)}]`;
        }
        
        // 获取构造函数名称
        const constructorName = value.constructor?.name || 'Object';
        const objectId = `${constructorName}@${seen.size}`;
        seen.set(value, objectId);
        
        // 快速检查：跳过已知的问题构造函数类型
        if (problematicConstructors.includes(constructorName)) {
          return `[${constructorName}]`;
        }
        
        // 特殊类型检查
        if (value instanceof Buffer || 
            value instanceof Date || 
            value instanceof Error ||
            value instanceof Map ||
            value instanceof Set ||
            value instanceof RegExp ||
            value instanceof Function) {
          return `[${constructorName}]`;
        }
        
        // 功能性检查：流、事件发射器等
        if (typeof value.pipe === 'function' ||
            (typeof value.on === 'function' && typeof value.emit === 'function') ||
            typeof value.listen === 'function' ||
            typeof value.connect === 'function' ||
            typeof value.write === 'function' ||
            typeof value.end === 'function') {
          return `[${constructorName}]`;
        }
        
        // 检查是否包含可疑属性
        for (const prop of suspiciousProps) {
          if (prop in value) {
            // 对于可疑属性，直接替换为占位符而不是进一步检查
            const newPath = [...path, prop];
            // 防止路径过长导致栈溢出
            if (newPath.length > 10) {
              return `[${constructorName}]`;
            }
          }
        }
        
        // 处理数组
        if (Array.isArray(value)) {
          const result: any[] = [];
          for (let i = 0; i < Math.min(value.length, 100); i++) { // 限制数组长度，防止过大的数组
            try {
              // 确保索引转换为字符串并创建正确类型的path数组
              const indexStr = i.toString();
              const newPath: string[] = [...path, indexStr];
              result.push(processObject(value[i], newPath));
            } catch {
              result.push('[Error]');
            }
          }
          if (value.length > 100) {
            result.push(`...(+${value.length - 100} more)`);
          }
          return result;
        }
        
        // 处理普通对象 - 限制键数量以防止处理过大的对象
        const result: any = {};
        const keys = Object.keys(value);
        for (let i = 0; i < Math.min(keys.length, 50); i++) { // 限制对象键数量
          const key = keys[i];
          try {
            // 首先确保key不是undefined
            if (key !== undefined) {
              // 跳过可疑属性
              if (suspiciousProps.includes(key)) {
                result[key] = `[Skipped:${typeof value[key]}]`;
              } else {
                // 对嵌套对象进行递归处理
                const newPath: string[] = [...path, key];
                // 防止路径过长导致栈溢出
                if (newPath.length > 10) {
                  result[key] = '[DeepNested]';
                } else {
                  result[key] = processObject(value[key], newPath);
                }
              }
            }
          } catch {
            if (key !== undefined) {
              result[key] = '[Error]';
            }
          }
        }
        if (keys.length > 50) {
          result['...'] = `(+${keys.length - 50} more keys)`;
        }
        
        return result;
      };

      // 开始处理对象
      const processedObj = processObject(obj);
      
      // 如果发现了循环引用，记录日志但不影响程序运行
      if (circularCount > 0) {
        this.logger.debug(`检测到 ${circularCount} 个循环引用`);
      }
      
      // 对处理后的对象进行标准JSON序列化
      return JSON.stringify(processedObj);
    } catch (e) {
      // 如果序列化失败，返回更详细的错误信息但避免暴露敏感数据
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.warn(`JSON序列化失败: ${errorMessage}`);
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
